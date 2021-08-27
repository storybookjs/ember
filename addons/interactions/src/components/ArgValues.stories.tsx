import React from 'react';
import {
  NullNode,
  UndefinedNode,
  StringNode,
  BooleanNode,
  ClassNode,
  FunctionNode,
  ElementNode,
  DateNode,
  ErrorNode,
  RegExpNode,
  SymbolNode,
} from './ArgValues';

export default {
  title: 'ArgValues',
  decorators: [
    (Story: any) => (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 10,
          fontFamily: 'Monaco, monospace',
          fontSize: 12,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

class FooBar {}

export const All = () => (
  <>
    <NullNode />
    <UndefinedNode />
    <StringNode value="Hello world" />
    <StringNode value="https://github.com/storybookjs/storybook/blob/next/README.md" />
    <BooleanNode value={true} />
    <ClassNode value={new FooBar()} />
    <FunctionNode value={function goFaster() {}} />
    <ElementNode value={{ localName: 'div', id: 'foo' }} />
    <ElementNode value={{ localName: 'span', classList: ['foo', 'bar'] }} />
    <DateNode value={new Date(Date.UTC(2012, 11, 20, 0, 0, 0))} />
    <DateNode value={new Date(1600000000000)} />
    <DateNode value={new Date(1600000000123)} />
    <ErrorNode value={new TypeError("Cannot read property 'foo' of undefined")} />
    <ErrorNode value={new ReferenceError('Invalid left-hand side in assignment')} />
    <RegExpNode value={/([A-Z])\w+/gi} />
    <SymbolNode value={Symbol('Hello world')} />
  </>
);

export const Nullish = () => (
  <>
    <NullNode />
    <UndefinedNode />
  </>
);

export const String = () => (
  <>
    <StringNode value="Hello world" />
    <StringNode value="https://github.com/storybookjs/storybook/blob/next/README.md" />
    <StringNode value="012345678901234567890123456789012345678901234567890123456789" />
  </>
);

export const Booleans = () => (
  <>
    <BooleanNode value={true} />
    <BooleanNode value={false} />
  </>
);

export const Class = () => <ClassNode value={new FooBar()} />;

export const Function = () => <FunctionNode value={function goFaster() {}} />;

export const DOMElements = () => (
  <>
    <ElementNode value={{ localName: 'div', id: 'foo' }} />
    <ElementNode value={{ localName: 'span', classList: ['foo', 'bar'] }} />
    <ElementNode value={{ prefix: 'foo', localName: 'bar' }} />
  </>
);

export const Dates = () => (
  <>
    <DateNode value={new Date(Date.UTC(2012, 11, 20, 0, 0, 0))} />
    <DateNode value={new Date(1600000000000)} />
    <DateNode value={new Date(1600000000123)} />
  </>
);

export const Errors = () => (
  <>
    <ErrorNode value={new EvalError()} />
    <ErrorNode value={new SyntaxError("Can't do that")} />
    <ErrorNode value={new TypeError("Cannot read property 'foo' of undefined")} />
    <ErrorNode value={new ReferenceError('Invalid left-hand side in assignment')} />
    <ErrorNode
      value={
        new Error(
          "XMLHttpRequest cannot load https://example.com. No 'Access-Control-Allow-Origin' header is present on the requested resource."
        )
      }
    />
  </>
);

export const RegularExpressions = () => (
  <>
    <RegExpNode value={/hello/i} />
    <RegExpNode value={new RegExp(`src(.*)\\.js$`)} />
  </>
);

export const Symbols = () => (
  <>
    <SymbolNode value={Symbol()} />
    <SymbolNode value={Symbol('Hello world')} />
  </>
);
