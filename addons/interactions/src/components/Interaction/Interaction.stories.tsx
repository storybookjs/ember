import { ComponentStoryObj, ComponentMeta } from '@storybook/react';
import { expect } from '@storybook/jest';
import { CallStates } from '@storybook/instrumenter';
import { userEvent, within } from '@storybook/testing-library';
import { getCall } from '../../mocks';

import { Interaction } from './Interaction';
import SubnavStories from '../Subnav/Subnav.stories';

type Story = ComponentStoryObj<typeof Interaction>;

export default {
  title: 'Addons/Interactions/Interaction',
  component: Interaction,
  args: {
    callsById: new Map(),
    controls: SubnavStories.args.controls,
    controlStates: SubnavStories.args.controlStates,
  },
} as ComponentMeta<typeof Interaction>;

export const Active: Story = {
  args: {
    call: getCall(CallStates.ACTIVE),
  },
};

export const Waiting: Story = {
  args: {
    call: getCall(CallStates.WAITING),
  },
};

export const Failed: Story = {
  args: {
    call: getCall(CallStates.ERROR),
  },
};

export const Done: Story = {
  args: {
    call: getCall(CallStates.DONE),
  },
};

export const Disabled: Story = {
  args: { ...Done.args, controlStates: { ...SubnavStories.args.controlStates, goto: false } },
};

export const Hovered: Story = {
  ...Done,
  parameters: {
    // Set light theme to avoid stacked theme in chromatic
    theme: 'light',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button'));
    await expect(canvas.getByTestId('icon-active')).not.toBeNull();
  },
};
