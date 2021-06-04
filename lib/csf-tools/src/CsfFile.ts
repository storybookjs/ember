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
  parameters: Record<string, any>;
}

function parseIncludeExclude(prop: Node) {
  if (t.isArrayExpression(prop)) {
    return prop.elements.map((e) => {
      if (t.isStringLiteral(e)) return e.value;
      throw new Error(`Expected string literal: ${e}`);
    });
  }

  if (t.isStringLiteral(prop)) return new RegExp(prop.value);

  if (t.isRegExpLiteral(prop)) return new RegExp(prop.pattern, prop.flags);

  throw new Error(`Unknown include/exclude: ${prop}`);
}

const parseTitle = (value: any) => {
  if (t.isStringLiteral(value)) return value.value;
  logger.warn(`Unexpected meta.title: ${JSON.stringify(value)}`);
  return undefined;
};

const parseMeta = (declaration: t.ObjectExpression): Meta => {
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
            self._meta = parseMeta(node.declaration);
          } else if (
            // export default { ... } as Meta<...>
            t.isTSAsExpression(node.declaration) &&
            t.isObjectExpression(node.declaration.expression)
          ) {
            self._meta = parseMeta(node.declaration.expression);
          }
        },
      },
      ExportNamedDeclaration: {
        enter({ node }) {
          if (t.isVariableDeclaration(node.declaration)) {
            // export const X = ...;
            node.declaration.declarations.forEach((decl) => {
              if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
                const { name } = decl.id;
                const parameters = {
                  // __id: toId(self._meta.title, name),
                  // FiXME: Template.bind({});
                  __isArgsStory:
                    t.isArrowFunctionExpression(decl.init) && decl.init.params.length > 0,
                };
                self._stories[name] = {
                  id: 'FIXME',
                  name,
                  parameters,
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

    // default export can come at any point in the file, so we do this post processing last
    self._stories =
      self._meta && self._meta.title
        ? Object.entries(self._stories).reduce((acc, [name, story]) => {
            if (isExportStory(name, self._meta)) {
              const id = toId(self._meta.title, name);
              acc[name] = { ...story, id, parameters: { ...story.parameters, __id: id } };
            }
            return acc;
          }, {} as Record<string, Story>)
        : {}; // no meta = no stories
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
  const ast = parse(code, {
    sourceType: 'module',
    // FIXME: we should get this from the project config somehow?
    plugins: [
      'jsx',
      'typescript',
      ['decorators', { decoratorsBeforeExport: true }],
      'classProperties',
    ],
  });
  return new CsfFile(ast);
};

export const writeCsf = async (fileName: string, csf: CsfFile) => {
  const { code } = generate(csf._ast, {});
  await fs.writeFile(fileName, code);
};
