import { Call } from '@storybook/instrumenter';
import React from 'react';
import { styled, typography } from '@storybook/theming';
import { Node, MethodCall } from './MethodCall';

const StyledWrapper = styled.div(({ theme }) => ({
  backgroundColor: theme.background.content,
  padding: '20px',
  boxShadow: `0 0 0 1px ${theme.appBorderColor}`,
  color: theme.color.defaultText,
  fontFamily: typography.fonts.mono,
  fontSize: typography.size.s1,
}));

export default {
  title: 'Addons/Interactions/MethodCall',
  component: MethodCall,
  decorators: [
    (Story: any) => (
      <StyledWrapper>
        <Story />
      </StyledWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscren',
  },
};

class FooBar {}
export const Args = () => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10 }}>
    <Node value={null} />
    <Node value={undefined} />
    <Node value="Hello world" />
    <Node value="https://github.com/storybookjs/storybook/blob/next/README.md" />
    <Node value="012345678901234567890123456789012345678901234567890123456789" />
    {/* eslint-disable-next-line react/jsx-boolean-value */}
    <Node value={true} />
    <Node value={false} />
    <Node value={12345} />
    <Node value={['foo', 1, { hello: 'world' }]} />
    <Node value={[...Array(23)].map((_, i) => i)} />
    <Node value={{ hello: 'world' }} />
    <Node value={{ hello: 'world', arr: [1, 2, 3], more: 1 }} />
    <Node value={new FooBar()} />
    <Node value={function goFaster() {}} />
    <Node value={{ __element__: { localName: 'hr' } }} />
    <Node value={{ __element__: { localName: 'foo', prefix: 'x' } }} />
    <Node value={{ __element__: { localName: 'div', id: 'foo' } }} />
    <Node value={{ __element__: { localName: 'span', classNames: ['foo', 'bar'] } }} />
    <Node value={{ __element__: { localName: 'button', innerText: 'Click me' } }} />
    <Node value={new Date(Date.UTC(2012, 11, 20, 0, 0, 0))} />
    <Node value={new Date(1600000000000)} />
    <Node value={new Date(1600000000123)} />
    <Node value={new EvalError()} />
    <Node value={new SyntaxError("Can't do that")} />
    <Node value={new TypeError("Cannot read property 'foo' of undefined")} />
    <Node value={new ReferenceError('Invalid left-hand side in assignment')} />
    <Node
      value={
        new Error(
          "XMLHttpRequest cannot load https://example.com. No 'Access-Control-Allow-Origin' header is present on the requested resource."
        )
      }
    />
    <Node value={/hello/i} />
    <Node value={new RegExp(`src(.*)\\.js$`)} />
    {/* eslint-disable-next-line symbol-description */}
    <Node value={Symbol()} />
    <Node value={Symbol('Hello world')} />
  </div>
);

const calls: Call[] = [
  {
    id: '1',
    path: ['screen'],
    method: 'getByText',
    storyId: 'kind--story',
    args: ['Click'],
    interceptable: false,
    retain: false,
  },
  {
    id: '2',
    path: ['userEvent'],
    method: 'click',
    storyId: 'kind--story',
    args: [{ __callId__: '1' }],
    interceptable: true,
    retain: false,
  },
  {
    id: '3',
    path: [],
    method: 'expect',
    storyId: 'kind--story',
    args: [true],
    interceptable: true,
    retain: false,
  },
  {
    id: '4',
    path: [{ __callId__: '3' }, 'not'],
    method: 'toBe',
    storyId: 'kind--story',
    args: [false],
    interceptable: true,
    retain: false,
  },
  {
    id: '5',
    path: ['jest'],
    method: 'fn',
    storyId: 'kind--story',
    args: [function actionHandler() {}],
    interceptable: false,
    retain: false,
  },
  {
    id: '6',
    path: [],
    method: 'expect',
    storyId: 'kind--story',
    args: [{ __callId__: '5' }],
    interceptable: false,
    retain: false,
  },
  {
    id: '7',
    path: ['expect'],
    method: 'stringMatching',
    storyId: 'kind--story',
    args: [/hello/i],
    interceptable: false,
    retain: false,
  },
  {
    id: '8',
    path: [{ __callId__: '6' }, 'not'],
    method: 'toHaveBeenCalledWith',
    storyId: 'kind--story',
    args: [{ __callId__: '7' }, new Error("Cannot read property 'foo' of undefined")],
    interceptable: false,
    retain: false,
  },
];

const callsById = calls.reduce((acc, call) => {
  acc.set(call.id, call);
  return acc;
}, new Map<Call['id'], Call>());

export const Simple = () => <MethodCall call={callsById.get('1')} callsById={callsById} />;
export const Nested = () => <MethodCall call={callsById.get('2')} callsById={callsById} />;
export const Chained = () => <MethodCall call={callsById.get('4')} callsById={callsById} />;
export const Complex = () => <MethodCall call={callsById.get('8')} callsById={callsById} />;
