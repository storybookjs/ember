import { logger } from '@storybook/node-logger';
import type { Options, CoreConfig, Webpack5BuilderConfig } from '@storybook/core-common';
import type { Configuration } from 'webpack';

export async function createDefaultWebpackConfig(
  storybookBaseConfig: Configuration,
  options: Options
): Promise<Configuration> {
  if (
    options.presetsList.some((preset) =>
      /@storybook(\/|\\)preset-create-react-app/.test(
        typeof preset === 'string' ? preset : preset.name
      )
    )
  ) {
    return storybookBaseConfig;
  }

  const hasPostcssAddon = options.presetsList.some((preset) =>
    /@storybook(\/|\\)addon-postcss/.test(typeof preset === 'string' ? preset : preset.name)
  );

  let cssLoaders = {};
  if (!hasPostcssAddon) {
    logger.info(`=> Using implicit CSS loaders`);
    cssLoaders = {
      test: /\.css$/,
      sideEffects: true,
      use: [
        // TODO: Decide if we want to keep style-loader & css-loader in core
        // Trying to apply style-loader or css-loader to files that already have been
        // processed by them causes webpack to crash, so no one else can add similar
        // loader configurations to the `.css` extension.
        require.resolve('style-loader'),
        {
          loader: require.resolve('css-loader'),
          options: {
            importLoaders: 1,
          },
        },
      ],
    };
  }

  const isProd = storybookBaseConfig.mode !== 'development';

  const coreOptions = await options.presets.apply<CoreConfig>('core');
  const cacheConfig = (coreOptions.builder as Webpack5BuilderConfig).options?.fsCache
    ? {
        cache: { type: 'filesystem' as 'filesystem' },
      }
    : {};
  return {
    ...storybookBaseConfig,
    module: {
      ...storybookBaseConfig.module,
      rules: [
        ...storybookBaseConfig.module.rules,
        cssLoaders,
        {
          test: /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
          type: 'asset/resource',
          generator: {
            filename: isProd
              ? 'static/media/[name].[contenthash:8][ext]'
              : 'static/media/[path][name][ext]',
          },
        },
        {
          test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            },
          },
          generator: {
            filename: isProd
              ? 'static/media/[name].[contenthash:8][ext]'
              : 'static/media/[path][name][ext]',
          },
        },
      ],
    },
    resolve: {
      ...storybookBaseConfig.resolve,
      fallback: {
        ...storybookBaseConfig.resolve?.fallback,
        crypto: false,
        assert: false,
      },
    },
    ...cacheConfig,
  };
}
