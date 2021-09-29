import { Call, CallRef, ElementRef } from '@storybook/instrumenter';
import React, { Fragment, ReactElement } from 'react';

// Light theme
const colors = {
  base: 'black',
  nullish: 'slategray',
  string: 'forestgreen',
  number: 'mediumblue',
  boolean: 'crimson',
  objectkey: 'slategray',
  instance: 'orangered',
  function: 'orange',
  muted: 'darkgray',
  tag: {
    name: 'purple',
    suffix: 'darkblue',
  },
  date: 'blueviolet',
  error: {
    name: 'orangered',
    message: 'orange',
  },
  regex: {
    source: 'orangered',
    flags: 'orange',
  },
  meta: 'orange',
  method: 'royalblue',
};

// Dark theme
// const colors = {
//   base: 'gainsboro',
//   nullish: 'gray',
//   string: 'yellowgreen',
//   number: 'dodgerblue',
//   boolean: 'hotpink',
//   objectkey: 'darkgray',
//   instance: 'tomato',
//   function: 'gold',
//   muted: 'darkgray',
//   tag: {
//     name: 'cornflowerblue',
//     suffix: 'skyblue',
//   },
//   date: 'mediumslateblue',
//   error: {
//     name: 'orangered',
//     message: 'orange',
//   },
//   regex: {
//     source: 'springgreen',
//     flags: 'seagreen',
//   },
//   meta: 'orange',
//   method: 'cornflowerblue',
// };

const special = /[^A-Z0-9]/i;
const trimEnd = /[\s.,…]+$/gm;
const ellipsize = (string: string, maxlength: number): string => {
  if (string.length <= maxlength) return string;
  for (let i = maxlength - 1; i >= 0; i -= 1) {
    if (special.test(string[i]) && i > 10) {
      return `${string.slice(0, i).replace(trimEnd, '')}…`;
    }
  }
  return `${string.slice(0, maxlength).replace(trimEnd, '')}…`;
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
      : [node, React.cloneElement(separator, { key: `sep${index}` })]
  );

export const Node = ({
  value,
  nested,
  callsById,
  ...props
}: {
  value: any;
  nested?: boolean;
  callsById?: Map<Call['id'], Call>;
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
    case Object.prototype.hasOwnProperty.call(value, '__element__'):
      // eslint-disable-next-line no-underscore-dangle
      return <ElementNode value={value.__element__} {...props} />;
    case Object.prototype.hasOwnProperty.call(value, '__callId__'):
      // eslint-disable-next-line no-underscore-dangle
      return <MethodCall call={callsById.get(value.__callId__)} callsById={callsById} />;
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
  <span style={{ color: colors.nullish }} {...props}>
    null
  </span>
);

export const UndefinedNode = (props: object) => (
  <span style={{ color: colors.nullish }} {...props}>
    undefined
  </span>
);

export const StringNode = ({ value, ...props }: { value: string }) => (
  <span style={{ color: colors.string }} {...props}>
    {JSON.stringify(ellipsize(value, 50))}
  </span>
);

export const NumberNode = ({ value, ...props }: { value: number }) => (
  <span style={{ color: colors.number }} {...props}>
    {value}
  </span>
);

export const BooleanNode = ({ value, ...props }: { value: boolean }) => (
  <span style={{ color: colors.boolean }} {...props}>
    {String(value)}
  </span>
);

export const ArrayNode = ({ value, nested = false }: { value: any[]; nested?: boolean }) => {
  if (nested) {
    return <span style={{ color: colors.base }}>[…]</span>;
  }
  const nodes = value.slice(0, 3).map((v) => <Node key={v} value={v} nested />);
  const nodelist = interleave(nodes, <span>, </span>);
  if (value.length <= 3) {
    return <span style={{ color: colors.base }}>[{nodelist}]</span>;
  }
  return (
    <span style={{ color: colors.base }}>
      ({value.length}) [{nodelist}, …]
    </span>
  );
};

export const ObjectNode = ({ value, nested = false }: { value: object; nested?: boolean }) => {
  if (nested) {
    return <span style={{ color: colors.base }}>{'{…}'}</span>;
  }
  const nodelist = interleave(
    Object.entries(value)
      .slice(0, 1)
      .map(([k, v]) => (
        <Fragment key={k}>
          <span style={{ color: colors.objectkey }}>{k}: </span>
          <Node value={v} nested />
        </Fragment>
      )),
    <span>, </span>
  );
  if (Object.keys(value).length <= 2) {
    return (
      <span style={{ color: colors.base }}>
        {'{ '}
        {nodelist}
        {' }'}
      </span>
    );
  }
  return (
    <span style={{ color: colors.base }}>
      ({Object.keys(value).length}) {'{ '}
      {nodelist}
      {', … }'}
    </span>
  );
};

export const ClassNode = ({ value }: { value: Record<string, any> }) => (
  <span style={{ color: colors.instance }}>{value.constructor.name}</span>
);

export const FunctionNode = ({ value }: { value: Function }) => (
  <span style={{ color: colors.function }}>{value.name || 'anonymous'}</span>
);

export const ElementNode = ({ value }: { value: ElementRef['__element__'] }) => {
  const { prefix, localName, id, classNames = [], innerText } = value;
  const name = prefix ? `${prefix}:${localName}` : localName;
  return (
    <span style={{ wordBreak: 'keep-all' }}>
      <span key={`${name}_lt`} style={{ color: colors.muted }}>
        &lt;
      </span>
      <span key={`${name}_tag`} style={{ color: colors.tag.name }}>
        {name}
      </span>
      <span key={`${name}_suffix`} style={{ color: colors.tag.suffix }}>
        {id ? `#${id}` : classNames.reduce((acc, className) => `${acc}.${className}`, '')}
      </span>
      <span key={`${name}_gt`} style={{ color: colors.muted }}>
        &gt;
      </span>
      {!id && classNames.length === 0 && innerText && (
        <>
          <span key={`${name}_text`}>{innerText}</span>
          <span key={`${name}_close_lt`} style={{ color: colors.muted }}>
            &lt;
          </span>
          <span key={`${name}_close_tag`} style={{ color: colors.tag.name }}>
            /{name}
          </span>
          <span key={`${name}_close_gt`} style={{ color: colors.muted }}>
            &gt;
          </span>
        </>
      )}
    </span>
  );
};

export const DateNode = ({ value }: { value: Date }) => {
  const [date, time, ms] = value.toISOString().split(/[T.Z]/);
  return (
    <span style={{ whiteSpace: 'nowrap', color: colors.date }}>
      {date}
      <span style={{ opacity: 0.3 }}>T</span>
      {time === '00:00:00' ? <span style={{ opacity: 0.3 }}>{time}</span> : time}
      {ms === '000' ? <span style={{ opacity: 0.3 }}>.{ms}</span> : `.${ms}`}
      <span style={{ opacity: 0.3 }}>Z</span>
    </span>
  );
};

export const ErrorNode = ({ value }: { value: Error }) => (
  <span style={{ color: colors.error.name }}>
    {value.name}
    {value.message && ': '}
    {value.message && (
      <span
        style={{ color: colors.error.message }}
        title={value.message.length > 50 ? value.message : ''}
      >
        {ellipsize(value.message, 50)}
      </span>
    )}
  </span>
);

export const RegExpNode = ({ value }: { value: RegExp }) => (
  <span style={{ whiteSpace: 'nowrap', color: colors.regex.flags }}>
    /<span style={{ color: colors.regex.source }}>{value.source}</span>/{value.flags}
  </span>
);

export const SymbolNode = ({ value }: { value: symbol }) => {
  return (
    <span style={{ whiteSpace: 'nowrap', color: colors.instance }}>
      Symbol(
      {value.description && (
        <span style={{ color: colors.meta }}>{JSON.stringify(value.description)}</span>
      )}
      )
    </span>
  );
};

export const OtherNode = ({ value }: { value: any }) => {
  return <span style={{ color: colors.meta }}>{stringify(value)}</span>;
};

export const MethodCall = ({
  call,
  callsById,
}: {
  call: Call;
  callsById: Map<Call['id'], Call>;
}) => {
  // Call might be undefined during initial render, can be safely ignored.
  if (!call) return null;

  const path = call.path.flatMap((elem, index) => {
    // eslint-disable-next-line no-underscore-dangle
    const callId = (elem as CallRef).__callId__;
    return [
      callId ? (
        <MethodCall key={`elem${index}`} call={callsById.get(callId)} callsById={callsById} />
      ) : (
        <span key={`elem${index}`}>{elem}</span>
      ),
      <wbr key={`wbr${index}`} />,
      <span key={`dot${index}`}>.</span>,
    ];
  });

  const args = call.args.flatMap((arg, index, array) => {
    const node = <Node key={`node${index}`} value={arg} callsById={callsById} />;
    return index < array.length - 1
      ? [node, <span key={`comma${index}`}>,&nbsp;</span>, <wbr key={`wbr${index}`} />]
      : [node];
  });

  return (
    <>
      <span style={{ color: colors.base }}>{path}</span>
      <span style={{ color: colors.method }}>{call.method}</span>
      <span style={{ color: colors.base }}>
        (<wbr />
        {args}
        <wbr />)
      </span>
    </>
  );
};
