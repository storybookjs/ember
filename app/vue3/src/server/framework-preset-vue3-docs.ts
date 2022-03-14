import { findDistEsm, Options, StorybookConfig } from '@storybook/core-common';

export function webpackFinal(webpackConfig: any = {}, options: Options) {
  let vueDocgenOptions = {};

  options.presetsList?.forEach((preset) => {
    if (preset.name.includes('addon-docs') && preset.options.vueDocgenOptions) {
      const appendableOptions = preset.options.vueDocgenOptions;
      vueDocgenOptions = {
        ...vueDocgenOptions,
        ...appendableOptions,
      };
    }
  });

  webpackConfig.module.rules.push({
    test: /\.vue$/,
    loader: require.resolve('vue-docgen-loader', { paths: [require.resolve('@storybook/vue3')] }),
    enforce: 'post',
    options: {
      docgenOptions: {
        alias: webpackConfig.resolve.alias,
        ...vueDocgenOptions,
      },
    },
  });
  return webpackConfig;
}

export const config: StorybookConfig['config'] = (entry = []) => {
  return [...entry, findDistEsm(__dirname, 'client/docs/config')];
};
