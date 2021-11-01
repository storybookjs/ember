import { CallStates, Call } from '@storybook/instrumenter';

export const getCall = (state: CallStates): Call => {
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

  const overrides = CallStates.ERROR
    ? { exception: { callId: '', stack: '', message: "Things didn't work!" } }
    : {};

  return { ...defaultData, ...overrides };
};
