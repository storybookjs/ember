// eslint-disable-next-line import/no-extraneous-dependencies
import { Configuration } from 'webpack';
import { findDistEsm, Options, StorybookConfig } from '@storybook/core-common';

export function webpack(config: Configuration, options: Options) {
  const babelrcOptions = options.features?.babelModeV7 ? null : { babelrc: false };
  config.module.rules.push({
    test: [
      new RegExp(`src(.*)\\.js$`),
      new RegExp(`packages(\\/|\\\\)*(\\/|\\\\)src(\\/|\\\\)(.*)\\.js$`),
      new RegExp(`node_modules(\\/|\\\\)lit-html(.*)\\.js$`),
      new RegExp(`node_modules(\\/|\\\\)lit-element(.*)\\.js$`),
      new RegExp(`node_modules(\\/|\\\\)@open-wc(.*)\\.js$`),
      new RegExp(`node_modules(\\/|\\\\)@polymer(.*)\\.js$`),
      new RegExp(`node_modules(\\/|\\\\)@vaadin(.*)\\.js$`),
    ],
    use: {
      loader: require.resolve('babel-loader'),
      options: {
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import'),
          require.resolve('@babel/plugin-syntax-import-meta'),
          // webpack does not support import.meta.url yet, so we rewrite them in babel
          [require.resolve('babel-plugin-bundled-import-meta'), { importStyle: 'baseURI' }],
        ],
        presets: [
          [
            require.resolve('@babel/preset-env'),
            {
              useBuiltIns: 'entry',
              corejs: 3,
            },
          ],
        ],
        ...babelrcOptions,
      },
    },
  });

  return config;
}

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/preview/config')];
};
