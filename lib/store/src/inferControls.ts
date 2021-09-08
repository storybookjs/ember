import mapValues from 'lodash/mapValues';
import { logger } from '@storybook/client-logger';
import { AnyFramework, SBEnumType, StrictInputType, ArgTypesEnhancer } from '@storybook/csf';
import { filterArgTypes } from './filterArgTypes';
import { combineParameters } from './parameters';

type ControlsMatchers = {
  date: RegExp;
  color: RegExp;
};

const inferControl = (argType: StrictInputType, name: string, matchers: ControlsMatchers): any => {
  const { type, options } = argType;
  if (!type && !options) {
    return undefined;
  }

  // args that end with background or color e.g. iconColor
  if (matchers.color && matchers.color.test(name)) {
    const controlType = argType.type.name;

    if (controlType === 'string') {
      return { control: { type: 'color' } };
    }

    logger.warn(
      `Addon controls: Control of type color only supports string, received "${controlType}" instead`
    );
  }

  // args that end with date e.g. purchaseDate
  if (matchers.date && matchers.date.test(name)) {
    return { control: { type: 'date' } };
  }

  switch (type.name) {
    case 'array':
      return { control: { type: 'object' } };
    case 'boolean':
      return { control: { type: 'boolean' } };
    case 'string':
      return { control: { type: 'text' } };
    case 'number':
      return { control: { type: 'number' } };
    case 'enum': {
      const { value } = type as SBEnumType;
      return { control: { type: value?.length <= 5 ? 'radio' : 'select' }, options: value };
    }
    case 'function':
    case 'symbol':
      return null;
    default:
      return { control: { type: options ? 'select' : 'object' } };
  }
};

export const inferControls: ArgTypesEnhancer<AnyFramework> = (context) => {
  const {
    argTypes,
    parameters: { __isArgsStory, controls: { include = null, exclude = null, matchers = {} } = {} },
  } = context;
  if (!__isArgsStory) return argTypes;

  const filteredArgTypes = filterArgTypes(argTypes, include, exclude);
  const withControls = mapValues(filteredArgTypes, (argType, name) => {
    return argType?.type && inferControl(argType, name, matchers);
  });

  return combineParameters(withControls, filteredArgTypes);
};

inferControls.secondPass = true;

export const argTypesEnhancers = [inferControls];
