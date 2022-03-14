import type { StorybookConfig } from '@storybook/core-common';
import { findDistEsm } from '@storybook/core-common';
import { hasDocsOrControls } from '@storybook/docs-tools';

export const config: StorybookConfig['config'] = (entry = [], options) => {
  if (!hasDocsOrControls(options)) return entry;
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
