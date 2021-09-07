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
    hasNext: true,
    hasPrevious: true,
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

export const AtTheBeginning = {
  name: 'at the beginning',
  args: {
    status: CallState.DONE,
    hasPrevious: false,
  },
};

export const AtTheEnd = {
  name: 'at the end',
  args: {
    status: CallState.DONE,
    hasNext: false,
  },
};
