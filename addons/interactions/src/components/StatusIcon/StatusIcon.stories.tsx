import { CallState } from '../../types';
import { StatusIcon } from './StatusIcon';

export default {
  title: 'StatusIcon',
  component: StatusIcon,
  args: { status: CallState.PENDING },
};

export const Pending = {
  args: { status: CallState.PENDING },
};

export const Error = {
  args: { status: CallState.ERROR },
};

export const Done = {
  args: { status: CallState.DONE },
};
