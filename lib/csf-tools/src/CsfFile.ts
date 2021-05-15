/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-underscore-dangle */
import fs from 'fs-extra';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import * as t from '@babel/types';
import traverse, { Node } from '@babel/traverse';
import { toId, isExportStory } from '@storybook/csf';

const logger = console;

interface Meta {
  title?: string;
  includeStories?: string[] | RegExp;
  excludeStories?: string[] | RegExp;
}

interface Story {
  id: string;
  name: string;
}

const getMeta = (declaration: any): Meta => {
  // { title: 'asdf', includeStories: /.../ (or []), excludeStories: ... }
  const meta: Meta = {};
  declaration.properties.forEach((p: Node) => {
    if (t.isObjectProperty(p) && t.isIdentifier(p.key)) {
      if (p.key.name === 'title') {
        meta.title = parseTitle(p.value);
      } else if (['includeStories', 'excludeStories'].includes(p.key.name)) {
        // @ts-ignore
        meta[p.key.name] = parseIncludeExclude(p.value);
      }
    }
  });
  return meta;
};

const parseTitle = (value: any) => {
  if (value.type === 'StringLiteral') {
    return value.value;
  }
  return undefined;
};

function parseIncludeExclude(prop: any) {
  const { code } = generate(prop, {});
  // eslint-disable-next-line no-eval
  return eval(code);
}

export class CsfFile {
  _ast: Node;

  _meta?: Meta;

  _stories: Record<string, Story> = {};

  constructor(ast: Node) {
    this._ast = ast;
  }

  parse() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    traverse(this._ast, {
      ExportDefaultDeclaration: {
        enter({ node }) {
          if (t.isObjectExpression(node.declaration)) {
            // export default { ... };
            self._meta = getMeta(node.declaration);
          } else if (
            // export default { ... } as Meta<...>
            t.isTSAsExpression(node.declaration) &&
            t.isObjectExpression(node.declaration.expression)
          ) {
            self._meta = getMeta(node.declaration.expression);
          }
        },
      },
      ExportNamedDeclaration: {
        enter({ node }) {
          if (t.isVariableDeclaration(node.declaration)) {
            // export const X = ...;
            node.declaration.declarations.forEach((decl) => {
              if (
                t.isVariableDeclarator(decl) &&
                t.isIdentifier(decl.id) &&
                isExportStory(decl.id.name, self._meta)
              ) {
                const { name } = decl.id;
                self._stories[name] = {
                  id: toId(self._meta.title, name),
                  name,
                };
              }
            });
          }
        },
      },
      ExpressionStatement: {
        enter({ node }) {
          const { expression } = node;
          // B.storyName = 'some string';
          if (
            t.isAssignmentExpression(expression) &&
            t.isMemberExpression(expression.left) &&
            t.isIdentifier(expression.left.object) &&
            t.isIdentifier(expression.left.property, { name: 'storyName' }) &&
            t.isStringLiteral(expression.right)
          ) {
            const exportName = expression.left.object.name;
            const storyName = expression.right.value;
            const story = self._stories[exportName];
            if (!story) return;
            story.name = storyName;
          }
        },
      },
    });
    return self;
  }

  public get meta() {
    return this._meta;
  }

  public get stories() {
    return Object.values(this._stories);
  }
}

export const readCsf = async (fileName: string) => {
  const code = (await fs.readFile(fileName, 'utf-8')).toString();
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  return new CsfFile(ast);
};

export const writeCsf = async (fileName: string, csf: CsfFile) => {
  const { code } = generate(csf._ast, {});
  await fs.writeFile(fileName, code);
};
