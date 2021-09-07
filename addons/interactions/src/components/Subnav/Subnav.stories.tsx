import { CallState } from '../../types';
import { Subnav } from './Subnav';

export default {
  title: 'Subnav',
  component: Subnav,
  args: {
    onPrevious: () => {},
    onNext: () => {},
    onReplay: () => {},
    goToEnd: () => {},
    storyFileName: 'Subnav.stories.tsx',
  },
};

export const Pass = {
  args: {
    status: CallState.DONE,
  },
};

export const Fail = {
  args: {
    status: CallState.ERROR,
  },
};
export const Runs = {
  args: {
    status: CallState.PENDING,
  },
};
