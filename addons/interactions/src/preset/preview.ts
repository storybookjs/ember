import { Args } from '@storybook/addons';
import { ArgsEnhancer } from '@storybook/client-api';
import { jest } from '../jest-mock'

const addActionsFromArgTypes: ArgsEnhancer = ({ args }) => {
  return Object.entries(args).reduce((acc, [key, val]) => {
    acc[key] = typeof val === 'function' && val.name === 'actionHandler' ? jest.fn(val) : val;
    return acc;
  }, {} as Args)
};


export const argsEnhancers = [addActionsFromArgTypes];
