import { CallStates } from '@storybook/instrumenter';
import { StatusBadge } from './StatusBadge';

export default {
  title: 'Addons/Interactions/StatusBadge',
  component: StatusBadge,
  parameters: { layout: 'padded' },
};

export const Pass = {
  args: { status: CallStates.DONE },
};

export const Runs = {
  args: { status: CallStates.WAITING },
};

export const Fail = {
  args: { status: CallStates.ERROR },
};
