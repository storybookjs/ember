const { targetFromTargetString } = require('@angular-devkit/architect');

// Private angular devkit stuff
const {
  generateI18nBrowserWebpackConfigFromContext,
} = require('@angular-devkit/build-angular/src/utils/webpack-browser-config');
const {
  getCommonConfig,
  getStylesConfig,
  getTypescriptWorkerPlugin,
} = require('@angular-devkit/build-angular/src/webpack/configs');

const { filterOutStylingRules } = require('./utils/filter-out-styling-rules');

/**
 * Extract wepack config from angular-cli 12.2.x
 * ⚠️ This file is in JavaScript to not use TypeScript. Because current storybook TypeScript version is not compatible with Angular CLI.
 * FIXME: Try another way with TypeScript on future storybook version (7 maybe 🤞)
 *
 * @param {*} baseConfig Previous webpack config from storybook
 * @param {*} options PresetOptions
 */
exports.getWebpackConfig = async (baseConfig, options) => {
  const builderContext = options.angularBuilderContext;
  const target = options.angularBrowserTarget;

  let targetOptions = {};

  if (target) {
    targetOptions = await builderContext.getTargetOptions(targetFromTargetString(target));
  }

  const tsConfig = options.tsConfig ?? targetOptions.tsConfig;

  const { config: cliConfig } = await generateI18nBrowserWebpackConfigFromContext(
    {
      // Default required options
      index: 'noop-index',
      main: 'noop-main',
      outputPath: 'noop-out',

      // Target options to override
      ...targetOptions,

      // Fixed options
      optimization: false,
      namedChunks: false,
      progress: false,
      tsConfig,
      buildOptimizer: false,
      aot: false,
    },
    builderContext,
    (wco) => [getCommonConfig(wco), getStylesConfig(wco), getTypescriptWorkerPlugin(wco)]
  );

  const entry = [
    ...baseConfig.entry,
    ...(cliConfig.entry.styles ?? []),
    ...(cliConfig.entry.polyfills ?? []),
  ];

  // Don't use storybooks styling rules because we have to use rules created by @angular-devkit/build-angular
  // because @angular-devkit/build-angular created rules have include/exclude for global style files.
  const rulesExcludingStyles = filterOutStylingRules(baseConfig);

  const resolve = {
    ...baseConfig.resolve,
    modules: Array.from(new Set([...baseConfig.resolve.modules, ...cliConfig.resolve.modules])),
  };

  return {
    ...baseConfig,
    entry,
    module: {
      ...baseConfig.module,
      rules: [...cliConfig.module.rules, ...rulesExcludingStyles],
    },
    plugins: [...(cliConfig.plugins ?? []), ...baseConfig.plugins],
    resolve,
    resolveLoader: cliConfig.resolveLoader,
  };
};
