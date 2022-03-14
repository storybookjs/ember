import type { StorybookConfig } from '@storybook/core-common';
import { findDistEsm } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
