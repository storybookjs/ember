/* eslint-disable no-underscore-dangle */
import fs from 'fs-extra';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import * as t from '@babel/types';
import traverse, { Node } from '@babel/traverse';
import { toId, isExportStory, storyNameFromExport } from '@storybook/csf';

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

const findVarInitialization = (identifier: string, program: t.Program) => {
  let init: t.Node = null;
  let declarations: t.VariableDeclarator[] = null;
  program.body.find((node: t.Node) => {
    if (t.isVariableDeclaration(node)) {
      declarations = node.declarations;
    } else if (t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)) {
      declarations = node.declaration.declarations;
    }

    return (
      declarations &&
      declarations.find((decl: t.Node) => {
        if (
          t.isVariableDeclarator(decl) &&
          t.isIdentifier(decl.id) &&
          decl.id.name === identifier
        ) {
          init = decl.init;
          return true; // stop looking
        }
        return false;
      })
    );
  });
  return init;
};

const isArgsStory = ({ init }: t.VariableDeclarator, parent: t.Node) => {
  let storyFn: t.Node = init;
  // export const Foo = Bar.bind({})
  if (t.isCallExpression(init)) {
    const { callee, arguments: bindArguments } = init;
    if (
      t.isProgram(parent) &&
      t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object) &&
      t.isIdentifier(callee.property) &&
      callee.property.name === 'bind' &&
      (bindArguments.length === 0 ||
        (bindArguments.length === 1 &&
          t.isObjectExpression(bindArguments[0]) &&
          bindArguments[0].properties.length === 0))
    ) {
      const boundIdentifier = callee.object.name;
      const template = findVarInitialization(boundIdentifier, parent);
      if (template) {
        storyFn = template;
      }
    }
  }
  if (t.isArrowFunctionExpression(storyFn)) {
    return storyFn.params.length > 0;
  }
  return false;
};
export class CsfFile {
  _ast: Node;

  _meta?: Meta;

  _stories: Record<string, Story> = {};

  _metaAnnotations: Record<string, Node> = {};

  _storyAnnotations: Record<string, Record<string, Node>> = {};

  constructor(ast: Node) {
    this._ast = ast;
  }

  _parseMeta(declaration: t.ObjectExpression) {
    const meta: Meta = {};
    declaration.properties.forEach((p: t.ObjectProperty) => {
      if (t.isIdentifier(p.key)) {
        this._metaAnnotations[p.key.name] = p.value;

        if (p.key.name === 'title') {
          meta.title = parseTitle(p.value);
        } else if (['includeStories', 'excludeStories'].includes(p.key.name)) {
          // @ts-ignore
          meta[p.key.name] = parseIncludeExclude(p.value);
        }
      }
    });
    this._meta = meta;
  }

  parse() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    traverse(this._ast, {
      ExportDefaultDeclaration: {
        enter({ node, parent }) {
          let metaNode: t.ObjectExpression;
          if (t.isObjectExpression(node.declaration)) {
            // export default { ... };
            metaNode = node.declaration;
          } else if (
            // export default { ... } as Meta<...>
            t.isTSAsExpression(node.declaration) &&
            t.isObjectExpression(node.declaration.expression)
          ) {
            metaNode = node.declaration.expression;
          } else if (t.isIdentifier(node.declaration) && t.isProgram(parent)) {
            const init = findVarInitialization(node.declaration.name, parent);
            if (t.isObjectExpression(init)) {
              metaNode = init;
            }
          }

          if (!self._meta && metaNode) {
            self._parseMeta(metaNode);
          }
        },
      },
      ExportNamedDeclaration: {
        enter({ node, parent }) {
          if (t.isVariableDeclaration(node.declaration)) {
            // export const X = ...;
            node.declaration.declarations.forEach((decl) => {
              if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
                const { name } = decl.id;
                const parameters = {
                  // __id: toId(self._meta.title, name),
                  // FiXME: Template.bind({});
                  __isArgsStory: isArgsStory(decl, parent),
                };
                self._stories[name] = {
                  id: 'FIXME',
                  name,
                  parameters,
                };
                if (self._storyAnnotations[name]) {
                  logger.warn(`Unexpected annotations for "${name}" before story declaration`);
                } else {
                  self._storyAnnotations[name] = {};
                }
              }
            });
          }
        },
      },
      ExpressionStatement: {
        enter({ node, parent }) {
          const { expression } = node;
          // B.storyName = 'some string';
          if (
            t.isProgram(parent) &&
            t.isAssignmentExpression(expression) &&
            t.isMemberExpression(expression.left) &&
            t.isIdentifier(expression.left.object) &&
            t.isIdentifier(expression.left.property)
          ) {
            const exportName = expression.left.object.name;
            const annotationKey = expression.left.property.name;
            const annotationValue = expression.right;

            if (self._storyAnnotations[exportName]) {
              self._storyAnnotations[exportName][annotationKey] = annotationValue;
            } else {
              logger.debug(`skipping "${exportName}.${annotationKey}"`);
            }

            if (annotationKey === 'storyName' && t.isStringLiteral(annotationValue)) {
              const storyName = annotationValue.value;
              const story = self._stories[exportName];
              if (!story) return;
              story.name = storyName;
            }
          }
        },
      },
    });

    // default export can come at any point in the file, so we do this post processing last
    self._stories =
      self._meta && self._meta.title
        ? Object.entries(self._stories).reduce((acc, [key, story]) => {
            if (isExportStory(key, self._meta)) {
              const id = toId(self._meta.title, storyNameFromExport(key));
              acc[key] = { ...story, id, parameters: { ...story.parameters, __id: id } };
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

export const loadCsf = (code: string) => {
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

export const formatCsf = (csf: CsfFile) => {
  const { code } = generate(csf._ast, {});
  return code;
};

export const readCsf = async (fileName: string) => {
  const code = (await fs.readFile(fileName, 'utf-8')).toString();
  return loadCsf(code);
};

export const writeCsf = async (fileName: string, csf: CsfFile) => {
  await fs.writeFile(fileName, await formatCsf(csf));
};
