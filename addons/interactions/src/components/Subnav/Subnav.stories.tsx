import { action } from '@storybook/addon-actions';
import { CallStates } from '@storybook/instrumenter';
import { Subnav } from './Subnav';

export default {
  title: 'Addons/Interactions/Subnav',
  component: Subnav,
  args: {
    controls: {
      start: action('start'),
      back: action('back'),
      goto: action('goto'),
      next: action('next'),
      end: action('end'),
    },
    controlStates: {
      debugger: true,
      start: true,
      back: true,
      goto: true,
      next: true,
      end: true,
    },
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
