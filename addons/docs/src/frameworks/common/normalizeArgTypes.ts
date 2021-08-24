import mapValues from 'lodash/mapValues';
import { ArgTypes, SBType } from '@storybook/csf';

const normalizeType = (type: SBType | SBType['name']) => {
  return (type as SBType).name ? type : ({ name: type } as SBType);
};

const normalizeControl = (control?: any) =>
  typeof control === 'string' ? { type: control } : control;

export const normalizeArgTypes = (argTypes: ArgTypes) =>
  mapValues(argTypes, (argType) => {
    if (!argType) return argType;
    const normalized = { ...argType };
    const { type, control } = argType;
    if (type) normalized.type = normalizeType(type);
    if (control) normalized.control = normalizeControl(control);
    return normalized;
  });
