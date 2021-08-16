import { TestingStates } from '../../Panel';
import { StatusIcon } from './StatusIcon';

export default {
  title: 'StatusIcon',
  component: StatusIcon,
  args: { status: TestingStates.PENDING },
};

export const Pending = {
  args: { status: TestingStates.PENDING },
};

export const Error = {
  args: { status: TestingStates.ERROR },
};

export const Done = {
  args: { status: TestingStates.DONE },
};
