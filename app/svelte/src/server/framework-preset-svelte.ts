import { findDistEsm } from '@storybook/core-common';
import type { Options, StorybookConfig } from '@storybook/core-common';
import type { Configuration } from 'webpack';
import type { TransformOptions } from '@babel/core';

export async function webpack(config: Configuration, options: Options): Promise<Configuration> {
  const { preprocess = undefined, loader = {} } = await options.presets.apply(
    'svelteOptions',
    {} as any,
    options
  );

  const mainFields = (config.resolve.mainFields as string[]) || ['browser', 'module', 'main'];

  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(svelte|html)$/,
          loader: require.resolve('svelte-loader'),
          options: { preprocess, ...loader },
        },
      ],
    },
    resolve: {
      ...config.resolve,
      extensions: [...config.resolve.extensions, '.svelte'],
      alias: config.resolve.alias,
      mainFields: ['svelte', ...mainFields],
    },
  };
}

export async function babelDefault(config: TransformOptions): Promise<TransformOptions> {
  return {
    ...config,
    presets: [...(config?.presets || [])],
    plugins: [...(config?.plugins || [])],
  };
}

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/preview/config')];
};
