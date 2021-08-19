import mapValues from 'lodash/mapValues';
import { combineParameters } from '@storybook/store';
import { ArgTypesEnhancer } from './types';

export const ensureArgTypes: ArgTypesEnhancer = (context) => {
  const { argTypes: userArgTypes = {}, args = {} } = context.parameters;
  if (!args) return userArgTypes;
  const argTypes = mapValues(args, (_arg, name) => ({ name }));
  return combineParameters(argTypes, userArgTypes);
};
