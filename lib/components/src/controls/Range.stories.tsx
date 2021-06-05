import React, { useState } from 'react';
import { RangeControl } from './Range';

export default {
  title: 'Controls/Range',
  component: RangeControl,
};

const Template = ({
  initialValue,
  step,
  max,
}: {
  initialValue?: number;
  step?: number;
  max?: number;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <RangeControl
        name="range"
        value={value}
        onChange={(newVal) => setValue(newVal)}
        min={0}
        max={max || 20}
        step={step || 2}
      />
      <pre>{JSON.stringify(value) || 'undefined'}</pre>
    </>
  );
};

export const Basic = () => Template({ initialValue: 10 });

export const Zero = () => Template({ initialValue: 10 });

export const MaxLengthValue = () =>
  Template({ step: 0.00000000000002, initialValue: 1989.123123123123, max: 2000 });

export const Undefined = () => Template({});
