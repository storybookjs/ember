import type { StorybookConfig } from '@storybook/core-common';

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-vue'),
  require.resolve('./framework-preset-vue-docs'),
];
