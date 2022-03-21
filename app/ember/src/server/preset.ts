import type { StorybookConfig } from '@storybook/core-common';

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-babel-ember'),
  require.resolve('./framework-preset-ember-docs'),
];
