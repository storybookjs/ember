import React from 'react';
import { action } from '@storybook/addon-actions';
import Button, { Type } from './Button';

export default {
  title: 'Docgen/Button',
  component: Button,
};

export const SimpleButton = () => {
  const x = 0;
  return <Button onClick={action('button clicked')}>OK {x}</Button>;
};

const typeOptions = {
  Default: 'default',
  Action: 'action',
};

export const WithType = () => <Button type={typeOptions.Default as Type}>Label</Button>;
