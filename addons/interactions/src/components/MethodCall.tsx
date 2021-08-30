import React, { Fragment, ReactElement } from 'react';
import { Call, CallRef } from '../types';

const special = /[^A-Z0-9]/i;
const trimEnd = /[\s.,…]+$/gm;
const ellipsize = (string: string, maxlength: number) => {
  if (string.length <= maxlength) return string;
  for (let i = maxlength - 1; i >= 0; i--) {
    if (special.test(string[i]) && i > 10) return string.slice(0, i).replace(trimEnd, '') + '…';
  }
  return string.slice(0, maxlength).replace(trimEnd, '') + '…';
};

const stringify = (value: any) => {
  try {
    return JSON.stringify(value, null, 1);
  } catch (e) {
    return String(value);
  }
};

const interleave = (nodes: ReactElement[], separator: ReactElement) =>
  nodes.flatMap((node, index) =>
    index === nodes.length - 1
      ? [node]
      : [node, React.cloneElement(separator, { key: 'sep' + index })]
  );

export const Node = ({
  value,
  nested,
  callsById,
  ...props
}: {
  value: any;
  nested?: boolean;
  callsById?: Record<Call['id'], Call>;
  [props: string]: any;
}) => {
  switch (true) {
    case value === null:
      return <NullNode {...props} />;
    case value === undefined:
      return <UndefinedNode {...props} />;
    case typeof value === 'string':
      return <StringNode value={value} {...props} />;
    case typeof value === 'number':
      return <NumberNode value={value} {...props} />;
    case typeof value === 'boolean':
      return <BooleanNode value={value} {...props} />;
    case typeof value === 'function':
      return <FunctionNode value={value} {...props} />;
    case value instanceof Array:
      return <ArrayNode value={value} {...props} />;
    case value instanceof Date:
      return <DateNode value={value} {...props} />;
    case value instanceof Error:
      return <ErrorNode value={value} {...props} />;
    case value instanceof RegExp:
      return <RegExpNode value={value} {...props} />;
    case value.hasOwnProperty('__element__'):
      return <ElementNode value={value.__element__} {...props} />;
    case value.hasOwnProperty('__callId__'):
      return <MethodCall call={callsById[value.__callId__]} callsById={callsById} />;
    case typeof value === 'object' &&
      value.constructor?.name &&
      value.constructor?.name !== 'Object':
      return <ClassNode value={value} {...props} />;
    case Object.prototype.toString.call(value) === '[object Object]':
      return <ObjectNode value={value} {...props} />;
    default:
      return <OtherNode value={value} {...props} />;
  }
};

export const NullNode = (props: object) => (
  <span style={{ color: 'slategray' }} {...props}>
    null
  </span>
);

export const UndefinedNode = (props: object) => (
  <span style={{ color: 'slategray' }} {...props}>
    undefined
  </span>
);

export const StringNode = ({ value, ...props }: { value: string }) => (
  <span style={{ color: 'forestgreen' }} {...props}>
    {JSON.stringify(ellipsize(value, 50))}
  </span>
);

export const NumberNode = ({ value, ...props }: { value: number }) => (
  <span style={{ color: 'mediumblue' }} {...props}>
    {value}
  </span>
);

export const BooleanNode = ({ value, ...props }: { value: boolean }) => (
  <span style={{ color: 'crimson' }} {...props}>
    {String(value)}
  </span>
);

export const ArrayNode = ({ value, nested = false }: { value: any[]; nested?: boolean }) => {
  if (nested) {
    return <span>[…]</span>;
  }
  const nodes = value.slice(0, 3).map((v, i) => <Node key={`${i}`} value={v} nested={true} />);
  const nodelist = interleave(nodes, <span>, </span>);
  if (value.length <= 3) {
    return <span>[{nodelist}]</span>;
  }
  return (
    <span>
      ({value.length}) [{nodelist}, …]
    </span>
  );
};

export const ObjectNode = ({ value, nested = false }: { value: object; nested?: boolean }) => {
  if (nested) {
    return <span>{'{…}'}</span>;
  }
  const nodelist = interleave(
    Object.entries(value)
      .slice(0, 1)
      .map(([k, v], i) => (
        <Fragment key={'node' + i}>
          <span style={{ color: 'slategray' }}>{k}: </span>
          <Node value={v} nested />
        </Fragment>
      )),
    <span>, </span>
  );
  if (Object.keys(value).length <= 2) {
    return (
      <span>
        {'{ '}
        {nodelist}
        {' }'}
      </span>
    );
  }
  return (
    <span>
      ({Object.keys(value).length}) {'{ '}
      {nodelist}
      {', … }'}
    </span>
  );
};

export const ClassNode = ({ value }: { value: Object }) => (
  <span style={{ color: 'orangered' }}>{value.constructor.name}</span>
);

export const FunctionNode = ({ value }: { value: Function }) => (
  <span style={{ color: 'orange' }}>{value.name || 'anonymous'}</span>
);

export const ElementNode = ({
  value,
}: {
  value: { prefix?: string; localName: string; id?: string; classList?: string[] };
}) => {
  const { prefix, localName, id, classList = [] } = value;
  const name = prefix ? `${prefix}:${localName}` : localName;
  return (
    <span style={{ wordBreak: 'keep-all' }}>
      <span key={`${name}_open`} style={{ color: 'darkgray' }}>
        &lt;
      </span>
      <span key={`${name}_tag`} style={{ color: 'purple' }}>
        {name}
      </span>
      <span key={`${name}_suffix`} style={{ color: 'darkblue' }}>
        {id ? `#${id}` : [...classList].reduce((acc, className) => `${acc}.${className}`, '')}
      </span>
      <span key={`${name}_close`} style={{ color: 'darkgray' }}>
        &gt;
      </span>
    </span>
  );
};

export const DateNode = ({ value }: { value: Date }) => {
  const [date, time, ms] = value.toISOString().split(/[T.Z]/);
  return (
    <span style={{ whiteSpace: 'nowrap', color: 'blueviolet' }}>
      {date}
      <span style={{ opacity: 0.3 }}>T</span>
      {time === '00:00:00' ? <span style={{ opacity: 0.3 }}>{time}</span> : time}
      {ms === '000' ? <span style={{ opacity: 0.3 }}>.{ms}</span> : `.${ms}`}
      <span style={{ opacity: 0.3 }}>Z</span>
    </span>
  );
};

export const ErrorNode = ({ value }: { value: Error }) => (
  <span style={{ color: 'orangered' }}>
    {value.name}
    {value.message && ': '}
    {value.message && (
      <span style={{ color: 'orange' }} title={value.message.length > 50 ? value.message : ''}>
        {ellipsize(value.message, 50)}
      </span>
    )}
  </span>
);

export const RegExpNode = ({ value }: { value: RegExp }) => (
  <span style={{ whiteSpace: 'nowrap', color: 'orange' }}>
    {'/'}
    <span style={{ color: 'orangered' }}>{value.source}</span>
    {'/'}
    {value.flags}
  </span>
);

export const SymbolNode = ({ value }: { value: Symbol }) => {
  return (
    <span style={{ whiteSpace: 'nowrap', color: 'orangered' }}>
      Symbol(
      {value.description && (
        <span style={{ color: 'orange' }}>{JSON.stringify(value.description)}</span>
      )}
      )
    </span>
  );
};

export const OtherNode = ({ value }: { value: any }) => {
  return <span style={{ color: 'orange' }}>{stringify(value)}</span>;
};

export const MethodCall = ({
  call,
  callsById,
}: {
  call: Call;
  callsById: Record<Call['id'], Call>;
}) => {
  // Call might be undefined during initial render, can be safely ignored.
  if (!call) return null;

  const path = call.path.flatMap((elem, index) => {
    const callId = (elem as CallRef).__callId__;
    return [
      callId ? (
        <MethodCall key={'elem' + index} call={callsById[callId]} callsById={callsById} />
      ) : (
        <span key={'elem' + index}>{elem}</span>
      ),
      <wbr key={'wbr' + index} />,
      <span key={'dot' + index}>.</span>,
    ];
  });

  const args = call.args.flatMap((arg, index, array) => {
    const node = <Node key={'node' + index} value={arg} callsById={callsById} />;
    return index < array.length - 1
      ? [node, <span key={'comma' + index}>,&nbsp;</span>, <wbr key={'wbr' + index} />]
      : [node];
  });

  return (
    <>
      <span>{path}</span>
      <span style={{ color: 'royalblue' }}>{call.method}</span>
      <span>
        (<wbr />
        {args}
        <wbr />)
      </span>
    </>
  );
};
