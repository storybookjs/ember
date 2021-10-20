import type { StorybookConfig } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entries = []) => [
  ...entries,
  require.resolve('../../esm/client/preview/config'),
];

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-react'),
  require.resolve('./framework-preset-cra'),
  require.resolve('./framework-preset-react-docgen'),
];
