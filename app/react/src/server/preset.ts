import { findDistEsm } from '@storybook/core-common';
import type { StorybookConfig } from '@storybook/core-common';

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entries = []) => [
  ...entries,
  findDistEsm(__dirname, 'client/preview/config'),
];

export const addons: StorybookConfig['addons'] = [
  require.resolve('./framework-preset-react'),
  require.resolve('./framework-preset-cra'),
  require.resolve('./framework-preset-react-docs'),
];
