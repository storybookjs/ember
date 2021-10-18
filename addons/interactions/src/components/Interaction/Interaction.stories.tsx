import { CallStates } from '@storybook/instrumenter';

import { Interaction } from './Interaction';

export default {
  title: 'Addons/Interactions/Interaction',
  component: Interaction,
  args: {
    callsById: new Map(),
    isDisabled: false,
  },
};

const getCallMock = (state: CallStates) => {
  const defaultData = {
    id: 'addons-interactions-accountform--standard-email-filled [3] change',
    path: ['fireEvent'],
    method: 'change',
    storyId: 'addons-interactions-accountform--standard-email-filled',
    args: [
      {
        __callId__: 'addons-interactions-accountform--standard-email-filled [2] getByTestId',
        retain: false,
      },
      {
        target: {
          value: 'michael@chromatic.com',
        },
      },
    ],
    interceptable: true,
    retain: false,
    state,
  };

  const overrides = CallStates.ERROR ? { exception: { message: "Things didn't work!" } } : {};

  return { ...defaultData, ...overrides };
};

export const Active = {
  args: {
    call: getCallMock(CallStates.ACTIVE),
  },
};

export const Waiting = {
  args: {
    call: getCallMock(CallStates.WAITING),
  },
};

export const Failed = {
  args: {
    call: getCallMock(CallStates.ERROR),
  },
};

export const Done = {
  args: {
    call: getCallMock(CallStates.DONE),
  },
};

export const Disabled = {
  args: { ...Done.args, isDisabled: true },
};
