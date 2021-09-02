import mapValues from 'lodash/mapValues';
import dedent from 'ts-dedent';
import { logger } from '@storybook/client-logger';
import { combineParameters } from '@storybook/store';
import { Framework, SBType, ArgTypesEnhancer } from '@storybook/csf';

const inferType = (value: any, name: string, visited: Set<any>): SBType => {
  const type = typeof value;
  switch (type) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'function':
      return { name: type };
    case 'symbol':
      return { name: 'other', value: 'symbol' };
    default:
      break;
  }
  if (value) {
    if (visited.has(value)) {
      logger.warn(dedent`
        We've detected a cycle in arg '${name}'. Args should be JSON-serializable.

        More info: https://storybook.js.org/docs/react/essentials/controls#fully-custom-args
      `);
      return { name: 'other', value: 'cyclic object' };
    }
    visited.add(value);
    if (Array.isArray(value)) {
      const childType: SBType =
        value.length > 0
          ? inferType(value[0], name, new Set(visited))
          : { name: 'other', value: 'unknown' };
      return { name: 'array', value: childType };
    }
    const fieldTypes = mapValues(value, (field) => inferType(field, name, new Set(visited)));
    return { name: 'object', value: fieldTypes };
  }
  return { name: 'object', value: {} };
};

export const inferArgTypes: ArgTypesEnhancer<Framework> = (context) => {
  const { id, argTypes: userArgTypes = {}, initialArgs = {} } = context;
  const argTypes = mapValues(initialArgs, (arg, key) => ({
    name: key,
    type: inferType(arg, `${id}.${key}`, new Set()),
  }));
  const userArgTypesNames = mapValues(userArgTypes, (argType, key) => ({
    name: key,
  }));
  return combineParameters(argTypes, userArgTypesNames, userArgTypes);
};

inferArgTypes.secondPass = true;
