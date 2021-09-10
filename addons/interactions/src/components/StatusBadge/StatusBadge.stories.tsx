import { StatusBadge } from './StatusBadge';
import { CallStates } from '../../types';

export default {
  title: 'Addons/Interactions/StatusBadge',
  component: StatusBadge,
  parameters: { layout: 'padded' },
};

export const Pass = {
  args: { status: CallStates.DONE },
};

export const Runs = {
  args: { status: CallStates.PENDING },
};

export const Fail = {
  args: { status: CallStates.ERROR },
};
