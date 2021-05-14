import React, { FC, ChangeEvent, useState, useCallback } from 'react';
import { styled } from '@storybook/theming';

import { Form } from '../form';
import { ControlProps, NumberValue, NumberConfig } from './types';

const Wrapper = styled.label({
  display: 'flex',
});

type NumberProps = ControlProps<NumberValue | null> & NumberConfig;

export const parse = (value: string) => {
  const result = parseFloat(value);
  return Number.isNaN(result) ? undefined : result;
};

export const format = (value: NumberValue) => (value != null ? String(value) : '');

export const NumberControl: FC<NumberProps> = ({
  name,
  value,
  onChange,
  min,
  max,
  step,
  onBlur,
  onFocus,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parse(event.target.value));
  };

  const [forceVisible, onSetForceVisible] = useState(false);
  const onForceVisible = useCallback(() => {
    onChange(0);
    onSetForceVisible(true);
  }, [onSetForceVisible]);
  if (value === undefined) {
    return <Form.Button onClick={onForceVisible}>Set number</Form.Button>;
  }

  return (
    <Wrapper>
      <Form.Input
        type="number"
        onChange={handleChange}
        size="flex"
        placeholder="Edit number..."
        value={value}
        autoFocus={forceVisible}
        {...{ name, min, max, step, onFocus, onBlur }}
      />
    </Wrapper>
  );
};
