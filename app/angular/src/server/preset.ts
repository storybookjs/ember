import type { StorybookConfig } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entries = []) => [
  ...entries,
  require.resolve('../client/preview/config'),
];

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-angular'),
  require.resolve('./framework-preset-angular-cli'),
  require.resolve('./framework-preset-angular-ivy'),
];
