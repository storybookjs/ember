import { StatusBadge } from './StatusBadge';
import { CallState } from '../../types';

export default {
  title: 'StatusBadge',
  component: StatusBadge,
  paramaters: { layout: 'padded' },
};

export const Pass = {
  args: { status: CallState.DONE },
};

export const Runs = {
  args: { status: CallState.PENDING },
};

export const Fail = {
  args: { status: CallState.ERROR },
};
