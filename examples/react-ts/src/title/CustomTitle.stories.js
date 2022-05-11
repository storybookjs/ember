import React from 'react';
import { Form } from '@storybook/components';

const { Button } = Form;

export default {
    title: 'CustomTitle',
    component: Button,
};

export const Basic = () => <Button label="Click me" />;
