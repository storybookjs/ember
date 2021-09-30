import { CallStates } from '@storybook/instrumenter';
import { Subnav } from './Subnav';

export default {
  title: 'Addons/Interactions/Subnav',
  component: Subnav,
  args: {
    onPrevious: () => {},
    onNext: () => {},
    onReplay: () => {},
    goToStart: () => {},
    goToEnd: () => {},
    storyFileName: 'Subnav.stories.tsx',
    hasNext: true,
    hasPrevious: true,
  },
};

export const Pass = {
  args: {
    status: CallStates.DONE,
  },
};

export const Fail = {
  args: {
    status: CallStates.ERROR,
  },
};

export const Runs = {
  args: {
    status: CallStates.WAITING,
  },
};

export const AtTheBeginning = {
  name: 'at the beginning',
  args: {
    status: CallStates.DONE,
    hasPrevious: false,
  },
};

export const AtTheEnd = {
  name: 'at the end',
  args: {
    status: CallStates.DONE,
    hasNext: false,
  },
};
