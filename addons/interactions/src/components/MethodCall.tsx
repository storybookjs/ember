import React from 'react'
import { Call, CallRef } from '../Panel'

const stringify = (value: any) => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
};

export const MethodCall = ({ call, callsById }: { call: Call; callsById: Record<Call['id'], Call> }) => {
  const path = call.path.flatMap((elem, index) => {
    const callId = (elem as CallRef).__callId__;
    return [
      callId ? (
        <MethodCall call={callsById[callId]} callsById={callsById} key={index} />
      ) : (
        <span key={index}>{elem}</span>
      ),
      <span key={'dot' + index}>.</span>,
    ];
  });

  const args = call.args.flatMap((arg, index, array) => {
    const nodes = [];
    if (arg?.__callId__) {
      nodes.push(<MethodCall key={call.id} call={callsById[arg.__callId__]} callsById={callsById} />);
    } else if (arg?.__element__) {
      const { prefix, localName, id, classList } = arg.__element__;
      const name = prefix ? `${prefix}:${localName}` : localName;
      nodes.push(
        <span key={`${name}_open`} style={{ color: 'gray' }}>
          &lt;
        </span>,
        <span key={`${name}_tag`} style={{ color: 'purple' }}>
          {name}
        </span>,
        <span key={`${name}_suffix`} style={{ color: 'darkblue' }}>
          {id ? `#${id}` : [...classList].reduce((acc, className) => `${acc}.${className}`, '')}
        </span>,
        <span key={`${name}_close`} style={{ color: 'gray' }}>
          &gt;
        </span>,
      );
    } else if (typeof arg === 'object' && arg?.constructor?.name && arg?.constructor?.name !== 'Object') {
      nodes.push(
        <span key={arg} style={{ color: 'hotpink' }}>
          {arg.constructor.name}
        </span>
      );
    } else {
      const color = { string: 'forestgreen', boolean: 'crimson' }[typeof arg as string] || 'orange';
      nodes.push(
        <span key={arg} style={{ color }}>
          {stringify(arg)}
        </span>
      );
    }
    if (index < array.length - 1) {
      nodes.push(<span key={index}>,&nbsp;</span>);
    }
    return nodes;
  });

  return (
    <>
      <span>{path}</span>
      <span style={{ color: 'royalblue' }}>{call.method}</span>
      <span>({args})</span>
    </>
  );
};
