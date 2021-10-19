import { ComponentStoryObj, ComponentMeta } from '@storybook/react';
import { expect } from '@storybook/jest';
import { Call, CallStates } from '@storybook/instrumenter';
import { userEvent, within } from '@storybook/testing-library';

import { Interaction } from './Interaction';

type Story = ComponentStoryObj<typeof Interaction>;

export default {
  title: 'Addons/Interactions/Interaction',
  component: Interaction,
  args: {
    callsById: new Map(),
    isDisabled: false,
  },
} as ComponentMeta<typeof Interaction>;

const getCallMock = (state: CallStates): Call => {
  const defaultData = {
    id: 'addons-interactions-accountform--standard-email-filled [3] change',
    path: ['fireEvent'],
    method: 'change',
    storyId: 'addons-interactions-accountform--standard-email-filled',
    args: [
      {
        __callId__: 'addons-interactions-accountform--standard-email-filled [2] getByTestId',
        retain: false,
      },
      {
        target: {
          value: 'michael@chromatic.com',
        },
      },
    ],
    interceptable: true,
    retain: false,
    state,
  };

  const overrides = CallStates.ERROR
    ? { exception: { callId: '', stack: '', message: "Things didn't work!" } }
    : {};

  return { ...defaultData, ...overrides };
};

export const Active: Story = {
  args: {
    call: getCallMock(CallStates.ACTIVE),
  },
};

export const Waiting: Story = {
  args: {
    call: getCallMock(CallStates.WAITING),
  },
};

export const Failed: Story = {
  args: {
    call: getCallMock(CallStates.ERROR),
  },
};

export const Done: Story = {
  args: {
    call: getCallMock(CallStates.DONE),
  },
};

export const Disabled: Story = {
  args: { ...Done.args, isDisabled: true },
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
