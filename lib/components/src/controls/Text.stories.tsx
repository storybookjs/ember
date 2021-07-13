import React, { useState } from 'react';
import { TextControl } from './Text';

export default {
  title: 'Controls/Text',
  component: TextControl,
};

const Template = (initialValue?: string) => {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <TextControl name="Text" value={value} onChange={(newVal) => setValue(newVal)} />
      <pre>{JSON.stringify(value) || 'undefined'}</pre>
    </>
  );
};

export const Basic = () => Template('Hello text');

export const Empty = () => Template('');

export const Undefined = () => Template(undefined);
