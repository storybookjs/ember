import React from 'react';
import { Call } from '../types';
import { MethodCall } from './MethodCall';

export default {
  title: 'MethodCall',
  decorators: [
    (Story: any) => (
      <span style={{ fontFamily: 'Monaco, monospace', fontSize: 12 }}>
        <Story />
      </span>
    ),
  ],
};

const calls = [
  {
    id: '1',
    path: ['screen'],
    method: 'getByText',
    args: ['Click'],
    interceptable: false,
  },
  {
    id: '2',
    path: ['userEvent'],
    method: 'click',
    args: [{ __callId__: '1' }],
    interceptable: true,
  },
  {
    id: '3',
    path: [],
    method: 'expect',
    args: [true],
    interceptable: true,
  },
  {
    id: '4',
    path: [{ __callId__: '3' }, 'not'],
    method: 'toBe',
    args: [false],
    interceptable: true,
  },
  {
    id: '5',
    path: ['jest'],
    method: 'fn',
    args: [function actionHandler() {}],
    interceptable: false,
  },
  {
    id: '6',
    path: [],
    method: 'expect',
    args: [{ __callId__: '5'}],
    interceptable: false,
  },
  {
    id: '7',
    path: ['expect'],
    method: 'stringMatching',
    args: [/hello/i],
    interceptable: false,
  },
  {
    id: '8',
    path: [{ __callId__: '6'}, 'not'],
    method: 'toHaveBeenCalledWith',
    args: [{ __callId__: '7'}, new Error("Cannot read property 'foo' of undefined")],
    interceptable: false,
  },
];

const callsById = calls.reduce(
  (acc, call) => ({ ...acc, [call.id]: call }),
  {} as Record<Call['id'], Call>
);

export const Simple = () => <MethodCall call={callsById['1']} callsById={callsById} />;
export const Nested = () => <MethodCall call={callsById['2']} callsById={callsById} />;
export const Chained = () => <MethodCall call={callsById['4']} callsById={callsById} />;
export const Complex = () => <MethodCall call={callsById['8']} callsById={callsById} />;
