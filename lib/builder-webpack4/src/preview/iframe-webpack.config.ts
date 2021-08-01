import path from 'path';
import fse from 'fs-extra';
import { DefinePlugin, HotModuleReplacementPlugin, ProgressPlugin } from 'webpack';
import Dotenv from 'dotenv-webpack';
// @ts-ignore
import { Configuration, RuleSetRule } from '@types/webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import WatchMissingNodeModulesPlugin from 'react-dev-utils/WatchMissingNodeModulesPlugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import VirtualModulePlugin from 'webpack-virtual-modules';
import PnpWebpackPlugin from 'pnp-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
// @ts-ignore
import FilterWarningsPlugin from 'webpack-filter-warnings-plugin';
import dedent from 'ts-dedent';

import themingPaths from '@storybook/theming/paths';

import {
  toRequireContextString,
  stringifyEnvs,
  es6Transpiler,
  interpolate,
  nodeModulesPaths,
  Options,
  NormalizedStoriesEntry,
} from '@storybook/core-common';
import { createBabelLoader } from './babel-loader-preview';

import { useBaseTsSupport } from './useBaseTsSupport';

const storybookPaths: Record<string, string> = [
  'addons',
  'api',
  'channels',
  'channel-postmessage',
  'components',
  'core-events',
  'router',
  'theming',
  'semver',
  'client-api',
  'client-logger',
].reduce(
  (acc, sbPackage) => ({
    ...acc,
    [`@storybook/${sbPackage}`]: path.dirname(
      require.resolve(`@storybook/${sbPackage}/package.json`)
    ),
  }),
  {}
);

export default async ({
  configDir,
  babelOptions,
  entries,
  configs,
  stories,
  outputDir = path.join('.', 'public'),
  quiet,
  packageJson,
  configType,
  framework,
  frameworkPath,
  presets,
  typescriptOptions,
  modern,
  features,
}: Options & Record<string, any>): Promise<Configuration> => {
  const logLevel = await presets.apply('logLevel', undefined);
  const frameworkOptions = await presets.apply(`${framework}Options`, {});

  const headHtmlSnippet = await presets.apply('previewHead');
  const bodyHtmlSnippet = await presets.apply('previewBody');
  const template = await presets.apply<string>('previewMainTemplate');
  const envs = await presets.apply<Record<string, string>>('env');

  const babelLoader = createBabelLoader(babelOptions, framework);
  const isProd = configType === 'PRODUCTION';
  const configEntryPath = path.resolve(path.join(configDir, 'storybook-config-entry.js'));
  const storiesFilename = 'storybook-stories.js';
  const storiesPath = path.resolve(path.join(configDir, storiesFilename));

  // Allows for custom frameworks that are not published under the @storybook namespace
  const virtualModuleMapping = {
    [storiesPath]: dedent`
      // TODO -- non-hardcoded importFn
      export const importFn = async (path) => {
        console.log('importFn ' + path);
        return import('./src/' + path.replace(/^src\//, ''));
      };
    `,
    [configEntryPath]: dedent`
    import { getGlobalsFromEntries } from '@storybook/core-client/dist/esm/preview/new/getGlobalsFromEntries';
    import { WebPreview } from '@storybook/core-client/dist/esm/preview/new/WebPreview';

    import { importFn } from './${storiesFilename}';

    ${configs
      .map(
        (fileName: string, index: number) =>
          `import * as configModuleExport${index} from "${fileName}";`
      )
      .join('\n')}

    const getGlobalMeta = () =>
      getGlobalsFromEntries([
        ${configs
          .map((fileName: string, index: number) => `configModuleExport${index}`)
          .join(',\n')}
      ]);

    const preview = new WebPreview({ importFn, getGlobalMeta });
    window.__STORYBOOK_PREVIEW__ = preview;
    
    if (module.hot) {
      module.hot.accept('./${storiesFilename}', () => {
        console.log('configEntry HMR accept storybook-stories.js');
        console.log(arguments);
        // importFn has changed so we need to patch the new one in
        preview.onModuleReload({ importFn });
      });
    }
    `,
  };

  console.log(virtualModuleMapping[configEntryPath]);
  // if (stories) {
  //   const storiesFilename = path.resolve(path.join(configDir, `generated-stories-entry.js`));
  //   // Make sure we also replace quotes for this one
  //   virtualModuleMapping[storiesFilename] = interpolate(storyTemplate, {
  //     frameworkImportPath,
  //   }).replace(
  //     "'{{stories}}'",
  //     stories
  //       .map((s: NormalizedStoriesEntry) => s.glob)
  //       .map(toRequireContextString)
  //       .join(',')
  //   );
  // }

  const shouldCheckTs = useBaseTsSupport(framework) && typescriptOptions.check;
  const tsCheckOptions = typescriptOptions.checkOptions || {};

  return {
    name: 'preview',
    mode: isProd ? 'production' : 'development',
    bail: isProd,
    devtool: 'cheap-module-source-map',
    entry: [...entries, configEntryPath],
    // stats: 'errors-only',
    output: {
      path: path.resolve(process.cwd(), outputDir),
      filename: isProd ? '[name].[contenthash:8].iframe.bundle.js' : '[name].iframe.bundle.js',
      publicPath: '',
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    plugins: [
      new FilterWarningsPlugin({
        exclude: /export '\S+' was not found in 'global'/,
      }),
      Object.keys(virtualModuleMapping).length > 0
        ? new VirtualModulePlugin(virtualModuleMapping)
        : null,
      new HtmlWebpackPlugin({
        filename: `iframe.html`,
        // FIXME: `none` isn't a known option
        chunksSortMode: 'none' as any,
        alwaysWriteToDisk: true,
        inject: false,
        templateParameters: (compilation, files, options) => ({
          compilation,
          files,
          options,
          version: packageJson.version,
          globals: {
            LOGLEVEL: logLevel,
            FRAMEWORK_OPTIONS: frameworkOptions,
            FEATURES: features,
            STORIES: stories,
          },
          headHtmlSnippet,
          bodyHtmlSnippet,
        }),
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: false,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
        },
        template,
      }),
      new DefinePlugin({
        'process.env': stringifyEnvs(envs),
        NODE_ENV: JSON.stringify(envs.NODE_ENV),
      }),
      isProd ? null : new WatchMissingNodeModulesPlugin(nodeModulesPaths),
      isProd ? null : new HotModuleReplacementPlugin(),
      new CaseSensitivePathsPlugin(),
      quiet ? null : new ProgressPlugin({}),
      new Dotenv({ silent: true }),
      shouldCheckTs ? new ForkTsCheckerWebpackPlugin(tsCheckOptions) : null,
    ].filter(Boolean),
    module: {
      rules: [
        babelLoader,
        es6Transpiler() as RuleSetRule,
        {
          test: /\.md$/,
          use: [
            {
              loader: require.resolve('raw-loader'),
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.cjs'],
      modules: ['node_modules'].concat(envs.NODE_PATH || []),
      mainFields: [modern ? 'sbmodern' : null, 'browser', 'module', 'main'].filter(Boolean),
      alias: {
        ...themingPaths,
        ...storybookPaths,
        react: path.dirname(require.resolve('react/package.json')),
        'react-dom': path.dirname(require.resolve('react-dom/package.json')),
      },

      plugins: [
        // Transparently resolve packages via PnP when needed; noop otherwise
        PnpWebpackPlugin,
      ],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: true,
      sideEffects: true,
      usedExports: true,
      moduleIds: 'named',
      minimizer: isProd
        ? [
            new TerserWebpackPlugin({
              parallel: true,
              terserOptions: {
                sourceMap: true,
                mangle: false,
                keep_fnames: true,
              },
            }),
          ]
        : [],
    },
    performance: {
      hints: isProd ? 'warning' : false,
    },
  };
};
