import { StatusBadge } from './StatusBadge';
import { TestingStates } from '../../Panel';

export default {
  title: 'StatusBadge',
  component: StatusBadge,
  paramaters: { layout: 'padded' },
};

export const Pass = {
  args: { status: TestingStates.DONE },
};

export const Runs = {
  args: { status: TestingStates.PENDING },
};

export const Fail = {
  args: { status: TestingStates.ERROR },
};
