import React from 'react';
import { Button } from '@storybook/react/demo';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
  title: 'Button',
  component: Button,
  argTypes: { onClick: { action: 'clicked' } },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Text = Template.bind({});
Text.args = {
  children: 'Hello button',
};

export const Emoji = Template.bind({});
Emoji.args = {
  children: '😀 😎 👍 💯',
};
