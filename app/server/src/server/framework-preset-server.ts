// eslint-disable-next-line import/no-extraneous-dependencies
import { Configuration } from 'webpack';
import path from 'path';
import type { StorybookConfig } from '@storybook/core-common';

export function webpack(config: Configuration) {
  config.module.rules.push({
    type: 'javascript/auto',
    test: /\.stories\.json$/,
    use: path.resolve(__dirname, './loader.js'),
  });

  config.module.rules.push({
    type: 'javascript/auto',
    test: /\.stories\.ya?ml/,
    use: [path.resolve(__dirname, './loader.js'), 'yaml-loader'],
  });

  return config;
}

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, require.resolve('../../esm/client/preview/config')];
};
