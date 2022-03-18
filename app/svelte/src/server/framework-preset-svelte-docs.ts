import path from 'path';

import { findDistEsm, Options, StorybookConfig } from '@storybook/core-common';

type Configuration = any;

export async function webpackFinal(webpackConfig: Configuration, options: Options) {
  const svelteOptions = await options.presets.apply('svelteOptions', {} as any, options);

  webpackConfig.module.rules.push({
    test: /\.svelte$/,
    loader: path.resolve(`${__dirname}/svelte-docgen-loader`),
    enforce: 'post',
    options: svelteOptions,
  });

  return webpackConfig;
}

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
