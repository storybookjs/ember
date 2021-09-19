import * as t from '@babel/types';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { babelParse } from './babelParse';

const getValue = (obj: t.ObjectExpression, key: string) => {
  let value: t.Expression;
  obj.properties.forEach((p: t.ObjectProperty) => {
    if (t.isIdentifier(p.key) && p.key.name === key) {
      value = p.value as t.Expression;
    }
  });
  return value;
};

const parseValue = (expr: t.Expression): any => {
  if (t.isArrayExpression(expr)) {
    return expr.elements.map((o: t.Expression) => {
      return parseValue(o);
    });
  }
  if (t.isObjectExpression(expr)) {
    return expr.properties.reduce((acc, p: t.ObjectProperty) => {
      if (t.isIdentifier(p.key)) {
        acc[p.key.name] = parseValue(p.value as t.Expression);
      }
      return acc;
    }, {} as any);
  }
  if (t.isLiteral(expr)) {
    // @ts-ignore
    return expr.value;
  }
  throw new Error(`Unknown node type ${expr}`);
};

export const getStorySortParameter = (previewCode: string) => {
  let storySort: t.Expression;
  const ast = babelParse(previewCode);
  traverse(ast, {
    ExportNamedDeclaration: {
      enter({ node }) {
        if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach((decl) => {
            if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
              const { name: exportName } = decl.id;
              if (exportName === 'parameters') {
                const paramsObject = t.isTSAsExpression(decl.init)
                  ? decl.init.expression
                  : decl.init;
                if (t.isObjectExpression(paramsObject)) {
                  const options = getValue(paramsObject, 'options');
                  if (options && t.isObjectExpression(options)) {
                    storySort = getValue(options, 'storySort');
                  }
                }
              }
            }
          });
        }
      },
    },
  });

  if (!storySort) return undefined;

  if (t.isArrowFunctionExpression(storySort)) {
    const { code: sortCode } = generate(storySort, {});
    // eslint-disable-next-line no-eval
    return eval(sortCode);
  }

  if (t.isFunctionExpression(storySort)) {
    const { code: sortCode } = generate(storySort, {});
    const functionName = storySort.id.name;
    // Wrap the function within an arrow function, call it, and return
    const wrapper = `(a, b) => {
      ${sortCode};
      return ${functionName}(a, b)
    }`;
    // eslint-disable-next-line no-eval
    return eval(wrapper);
  }

  return parseValue(storySort);
};
