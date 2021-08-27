import React from 'react';

const special = /[^A-Z0-9]/i
const trimEnd = /[\s.,…]+$/gm
const ellipsize = (string: string, maxlength: number) => {
  if (string.length <= maxlength) return string;
  for (let i = maxlength - 1; i >= 0; i--) {
    if (special.test(string[i]) && i > 10) return string.slice(0, i).replace(trimEnd, '') + '…'
  }
  return string.slice(0, maxlength).replace(trimEnd, '') + '…'
};

export const NullNode = () => <span style={{ color: 'slategray' }}>null</span>;

export const UndefinedNode = () => <span style={{ color: 'slategray' }}>undefined</span>;

export const StringNode = ({ value }: { value: string }) => (
  <span style={{ color: 'forestgreen' }}>{JSON.stringify(ellipsize(value, 50))}</span>
);

export const BooleanNode = ({ value }: { value: boolean }) => (
  <span style={{ color: 'crimson' }}>{String(value)}</span>
);

export const ObjectNode = ({ value }: { value: any }) => {
  const stringify = (value: any) => {
    try {
      return JSON.stringify(value, null, 1);
    } catch (e) {
      return String(value);
    }
  };
  return <span style={{ color: 'orange' }}>{stringify(value)}</span>;
};

export const ClassNode = ({ value }: { value: Object }) => (
  <span key={value.constructor.name} style={{ color: 'orangered' }}>
    {value.constructor.name}
  </span>
);

export const FunctionNode = ({ value }: { value: Function }) => (
  <span key={value.name} style={{ color: 'orange' }}>
    {value.name || 'anonymous'}
  </span>
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
