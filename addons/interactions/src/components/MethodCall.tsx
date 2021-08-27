import React from 'react';
import { Call, CallRef } from '../Panel';
import {
  ElementNode,
  FunctionNode,
  NullNode,
  UndefinedNode,
  ObjectNode,
  DateNode,
  ErrorNode,
  RegExpNode,
  ClassNode,
  StringNode,
  BooleanNode
} from './ArgValues';

export const MethodCall = ({
  call,
  callsById,
}: {
  call: Call;
  callsById: Record<Call['id'], Call>;
}) => {
  const path = call.path.flatMap((elem, index) => {
    const callId = (elem as CallRef).__callId__;
    return [
      callId ? (
        <MethodCall call={callsById[callId]} callsById={callsById} key={index} />
      ) : (
        <span key={index}>{elem}</span>
      ),
      <wbr />,
      <span key={'dot' + index}>.</span>,
    ];
  });

  const args = call.args.flatMap((arg, index, array) => {
    let node;
    switch (true) {
      case arg === null:
        node = <NullNode key={call.id} />;
        break;
      case arg === undefined:
        node = <UndefinedNode key={call.id} />;
        break;
      case typeof arg === 'string':
        node = <StringNode key={call.id} value={arg} />;
        break;
      case typeof arg === 'boolean':
        node = <BooleanNode key={call.id} value={arg} />;
        break;
      case typeof arg === 'function':
        node = <FunctionNode key={call.id} value={arg} />;
        break;
        case arg instanceof Date:
          node = <DateNode key={call.id} value={arg} />;
          break;
      case arg instanceof Error:
        node = <ErrorNode key={call.id} value={arg} />;
        break;
      case arg instanceof RegExp:
        node = <RegExpNode key={call.id} value={arg} />;
        break;
      case arg.hasOwnProperty('__element__'):
        node = <ElementNode key={call.id} value={arg.__element__} />;
        break;
      case arg.hasOwnProperty('__callId__'):
        node = <MethodCall key={call.id} call={callsById[arg.__callId__]} callsById={callsById} />;
        break;
      case typeof arg === 'object' && arg.constructor?.name && arg.constructor?.name !== 'Object':
        node = <ClassNode key={call.id} value={arg} />;
        break;
      default:
        node = <ObjectNode key={call.id} value={arg} />;
    }
    return index < array.length - 1 ? [node, <span key={index}>,&nbsp;</span>, <wbr />] : [node];
  });

  return (
    <>
      <span>{path}</span>
      <span style={{ color: 'royalblue' }}>{call.method}</span>
      <span>(<wbr />{args}<wbr />)</span>
    </>
  );
};
