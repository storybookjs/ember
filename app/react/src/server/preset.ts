import { findDistEsm, StorybookConfig } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entries = []) => [
  ...entries,
  findDistEsm(__dirname, 'client/preview/config'),
];

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-react'),
  require.resolve('./framework-preset-cra'),
  require.resolve('./framework-preset-react-docgen'),
];
