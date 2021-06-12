import React from 'react';
import { Meta } from '@storybook/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

export default {
  component: Button,
  title: 'Examples / Button',
  argTypes: { onClick: { action: 'click ' } },
  // render: () => <>hohoho</>,
} as Meta;

export const WithArgs = (args: any) => <Button {...args} />;
WithArgs.args = { label: 'With args' };
export const Basic = () => <Button label="Click me" />;

export const StoryObject = {
  render: () => <>hahaha</>,
};

export const StoryNoRender = {
  args: { label: 'magic!' },
};

export const StoryWithSetup = {
  args: { label: 'setup' },
  setup: () => {
    console.log('setup!!');
    userEvent.click(screen.getByRole('button'));
  },
};
