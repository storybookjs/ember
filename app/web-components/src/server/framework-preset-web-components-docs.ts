import { findDistEsm, StorybookConfig } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
