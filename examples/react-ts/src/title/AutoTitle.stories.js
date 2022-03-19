import React from 'react';
import { Form } from '@storybook/components';

const { Button } = Form;

export default {
  // Title not needed due to CSF3 auto-title
  // title: 'AutoTitle',
  component: Button,
};

export const Basic = () => <Button label="Click me" />;