// Private angular devkit stuff
const {
  generateI18nBrowserWebpackConfigFromContext,
} = require('@angular-devkit/build-angular/src/utils/webpack-browser-config');
const {
  getCommonConfig,
  getStylesConfig,
  getTypeScriptConfig,
} = require('@angular-devkit/build-angular/src/webpack/configs');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { filterOutStylingRules } = require('./utils/filter-out-styling-rules');

/**
 * Extract webpack config from angular-cli 12.2.x
 * ⚠️ This file is in JavaScript to not use TypeScript. Because current storybook TypeScript version is not compatible with Angular CLI.
 * FIXME: Try another way with TypeScript on future storybook version (7 maybe 🤞)
 *
 * @param {*} baseConfig Previous webpack config from storybook
 * @param {*} options { builderOptions, builderContext }
 */
exports.getWebpackConfig = async (baseConfig, { builderOptions, builderContext }) => {
  /**
   * Get angular-cli Webpack config
   */
  const { config: cliConfig } = await generateI18nBrowserWebpackConfigFromContext(
    {
      // Default options
      index: 'noop-index',
      main: 'noop-main',
      outputPath: 'noop-out',

      // Options provided by user
      ...builderOptions,

      // Fixed options
      optimization: false,
      namedChunks: false,
      progress: false,
      buildOptimizer: false,
      aot: false,
    },
    builderContext,
    (wco) => [getCommonConfig(wco), getStylesConfig(wco), getTypeScriptConfig(wco)]
  );

  /**
   * Merge baseConfig Webpack with angular-cli Webpack
   */
  const entry = [
    ...baseConfig.entry,
    ...(cliConfig.entry.styles ?? []),
    ...(cliConfig.entry.polyfills ?? []),
  ];

  // Don't use storybooks styling rules because we have to use rules created by @angular-devkit/build-angular
  // because @angular-devkit/build-angular created rules have include/exclude for global style files.
  const rulesExcludingStyles = filterOutStylingRules(baseConfig);
  const module = {
    ...baseConfig.module,
    rules: [...cliConfig.module.rules, ...rulesExcludingStyles],
  };

  const plugins = [...(cliConfig.plugins ?? []), ...baseConfig.plugins];

  const resolve = {
    ...baseConfig.resolve,
    modules: Array.from(new Set([...baseConfig.resolve.modules, ...cliConfig.resolve.modules])),
    plugins: [
      new TsconfigPathsPlugin({
        configFile: builderOptions.tsConfig,
        mainFields: ['browser', 'module', 'main'],
      }),
    ],
  };

  return {
    ...baseConfig,
    entry,
    module,
    plugins,
    resolve,
    resolveLoader: cliConfig.resolveLoader,
  };
};
