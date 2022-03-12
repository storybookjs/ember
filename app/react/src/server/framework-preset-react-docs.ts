import type { StorybookConfig } from '@storybook/core-common';
import { findDistEsm } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entry = [], options) => {
  console.log({ options });
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
