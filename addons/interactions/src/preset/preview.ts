import { Args, addons } from '@storybook/addons';
import { ArgsEnhancer } from '@storybook/client-api';
import { jest } from '../jest-mock';
import { EVENTS } from '../constants';

const channel = addons.getChannel();

const addActionsFromArgTypes: ArgsEnhancer = ({ args }) => {
  const mocks: any[] = [];
  channel.on(EVENTS.RESET, () => {
    // mocks.forEach(mock => mock.mockReset())
  });
  return Object.entries(args).reduce((acc, [key, val]) => {
    if (typeof val === 'function' && val.name === 'actionHandler') {
      acc[key] = jest.fn(val);
      mocks.push(acc[key]);
      return acc;
    }
    acc[key] = val;
    return acc;
  }, {} as Args);
};

export const argsEnhancers = [addActionsFromArgTypes];
