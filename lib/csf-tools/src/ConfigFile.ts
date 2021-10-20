/* eslint-disable no-underscore-dangle */
import fs from 'fs-extra';
import * as t from '@babel/types';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import { babelParse } from './babelParse';

const logger = console;

const propKey = (p: t.ObjectProperty) => {
  if (t.isIdentifier(p.key)) return p.key.name;
  if (t.isStringLiteral(p.key)) return p.key.value;
  return null;
};

const _getPath = (path: string[], node: t.Node): t.Node | undefined => {
  if (path.length === 0) {
    return node;
  }
  if (t.isObjectExpression(node)) {
    const [first, ...rest] = path;
    const field = node.properties.find((p: t.ObjectProperty) => propKey(p) === first);
    if (field) {
      return _getPath(rest, (field as t.ObjectProperty).value);
    }
  }
  return undefined;
};

const _findVarInitialization = (identifier: string, program: t.Program) => {
  let init: t.Expression = null;
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

const _makeObjectExpression = (path: string[], value: t.Expression): t.Expression => {
  if (path.length === 0) return value;
  const [first, ...rest] = path;
  const innerExpression = _makeObjectExpression(rest, value);
  return t.objectExpression([t.objectProperty(t.identifier(first), innerExpression)]);
};

const _updateExportNode = (path: string[], expr: t.Expression, existing: t.ObjectExpression) => {
  const [first, ...rest] = path;
  const existingField = existing.properties.find(
    (p: t.ObjectProperty) => propKey(p) === first
  ) as t.ObjectProperty;
  if (!existingField) {
    existing.properties.push(
      t.objectProperty(t.identifier(first), _makeObjectExpression(rest, expr))
    );
  } else if (t.isObjectExpression(existingField.value) && rest.length > 0) {
    _updateExportNode(rest, expr, existingField.value);
  } else {
    existingField.value = _makeObjectExpression(rest, expr);
  }
};

export class ConfigFile {
  _ast: t.File;

  _exports: Record<string, t.Expression> = {};

  _exportsObject: t.ObjectExpression;

  fileName?: string;

  constructor(ast: t.File, fileName?: string) {
    this._ast = ast;
    this.fileName = fileName;
  }

  parse() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    traverse(this._ast, {
      ExportNamedDeclaration: {
        enter({ node, parent }) {
          if (t.isVariableDeclaration(node.declaration)) {
            // export const X = ...;
            node.declaration.declarations.forEach((decl) => {
              if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
                const { name: exportName } = decl.id;
                let exportVal = decl.init;
                if (t.isIdentifier(exportVal)) {
                  exportVal = _findVarInitialization(exportVal.name, parent as t.Program);
                }
                self._exports[exportName] = exportVal;
              }
            });
          } else {
            logger.warn(`Unexpected ${JSON.stringify(node)}`);
          }
        },
      },
      ExpressionStatement: {
        enter({ node, parent }) {
          if (t.isAssignmentExpression(node.expression) && node.expression.operator === '=') {
            const { left, right } = node.expression;
            if (
              t.isMemberExpression(left) &&
              t.isIdentifier(left.object) &&
              left.object.name === 'module' &&
              t.isIdentifier(left.property) &&
              left.property.name === 'exports'
            ) {
              let exportObject = right;
              if (t.isIdentifier(right)) {
                exportObject = _findVarInitialization(right.name, parent as t.Program);
              }
              if (t.isObjectExpression(exportObject)) {
                self._exportsObject = exportObject;
                exportObject.properties.forEach((p: t.ObjectProperty) => {
                  const exportName = propKey(p);
                  if (exportName) {
                    let exportVal = p.value;
                    if (t.isIdentifier(exportVal)) {
                      exportVal = _findVarInitialization(exportVal.name, parent as t.Program);
                    }
                    self._exports[exportName] = exportVal as t.Expression;
                  }
                });
              } else {
                logger.warn(`Unexpected ${JSON.stringify(node)}`);
              }
            }
          }
        },
      },
    });
    return self;
  }

  getFieldNode(path: string[]) {
    const [root, ...rest] = path;
    const exported = this._exports[root];
    if (!exported) return undefined;
    return _getPath(rest, exported);
  }

  getFieldValue(path: string[]) {
    const node = this.getFieldNode(path);
    if (node) {
      const { code } = generate(node, {});
      // eslint-disable-next-line no-eval
      const value = eval(`(() => (${code}))()`);
      return value;
    }
    return undefined;
  }

  setFieldNode(path: string[], expr: t.Expression) {
    const [first, ...rest] = path;
    const exportNode = this._exports[first];
    if (this._exportsObject) {
      _updateExportNode(path, expr, this._exportsObject);
      this._exports[path[0]] = expr;
    } else if (exportNode && t.isObjectExpression(exportNode) && rest.length > 0) {
      _updateExportNode(rest, expr, exportNode);
    } else {
      // create a new named export and add it to the top level
      const exportObj = _makeObjectExpression(rest, expr);
      const newExport = t.exportNamedDeclaration(
        t.variableDeclaration('const', [t.variableDeclarator(t.identifier(first), exportObj)])
      );
      this._exports[first] = exportObj;
      this._ast.program.body.push(newExport);
    }
  }

  setFieldValue(path: string[], value: any) {
    const stringified = JSON.stringify(value);
    const program = babelParse(`const __x = ${stringified}`);
    let valueNode;
    traverse(program, {
      VariableDeclaration: {
        enter({ node }) {
          if (
            node.declarations.length === 1 &&
            t.isVariableDeclarator(node.declarations[0]) &&
            t.isIdentifier(node.declarations[0].id) &&
            node.declarations[0].id.name === '__x'
          ) {
            valueNode = node.declarations[0].init;
          }
        },
      },
    });
    if (!valueNode) {
      throw new Error(`Unexpected value ${JSON.stringify(value)}`);
    }
    this.setFieldNode(path, valueNode);
  }
}

export const loadConfig = (code: string, fileName?: string) => {
  const ast = babelParse(code);
  return new ConfigFile(ast, fileName);
};

export const formatConfig = (config: ConfigFile) => {
  const { code } = generate(config._ast, {});
  return code;
};

export const readConfig = async (fileName: string) => {
  const code = (await fs.readFile(fileName, 'utf-8')).toString();
  return loadConfig(code, fileName).parse();
};

export const writeConfig = async (config: ConfigFile, fileName?: string) => {
  const fname = fileName || config.fileName;
  if (!fname) throw new Error('Please specify a fileName for writeConfig');
  await fs.writeFile(fname, await formatConfig(config));
};
