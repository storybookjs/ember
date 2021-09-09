import { CallStates } from '../../types';
import { StatusIcon } from './StatusIcon';

export default {
  title: 'StatusIcon',
  component: StatusIcon,
  args: { status: CallStates.PENDING },
};

export const Pending = {
  args: { status: CallStates.PENDING },
};

export const Error = {
  args: { status: CallStates.ERROR },
};

export const Done = {
  args: { status: CallStates.DONE },
};
