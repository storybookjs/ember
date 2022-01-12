import webpack from 'webpack';
import { logger } from '@storybook/node-logger';
import { targetFromTargetString, BuilderContext, Target } from '@angular-devkit/architect';
import { sync as findUpSync } from 'find-up';
import semver from '@storybook/semver';
import dedent from 'ts-dedent';

import { logging, JsonObject } from '@angular-devkit/core';
import { moduleIsAvailable } from './utils/module-is-available';
import { getWebpackConfig as getWebpackConfig12_2_x } from './angular-cli-webpack-12.2.x';
import { getWebpackConfig as getWebpackConfig13_x_x } from './angular-cli-webpack-13.x.x';
import { getWebpackConfig as getWebpackConfigOlder } from './angular-cli-webpack-older';
import { PresetOptions } from './options';
import {
  getDefaultProjectName,
  findAngularProjectTarget,
  readAngularWorkspaceConfig,
} from './angular-read-workspace';

export async function webpackFinal(baseConfig: webpack.Configuration, options: PresetOptions) {
  if (!moduleIsAvailable('@angular-devkit/build-angular')) {
    logger.info('=> Using base config because "@angular-devkit/build-angular" is not installed');
    return baseConfig;
  }

  const angularCliVersion = await import('@angular/cli').then((m) => semver.coerce(m.VERSION.full));

  /**
   * Ordered array to use the specific  getWebpackConfig according to some condition like angular-cli version
   */
  const webpackGetterByVersions: {
    info: string;
    condition: boolean;
    getWebpackConfig(
      baseConfig: webpack.Configuration,
      options: PresetOptions
    ): Promise<webpack.Configuration> | webpack.Configuration;
  }[] = [
    {
      info: '=> Loading angular-cli config for angular >= 13.0.0',
      condition: semver.satisfies(angularCliVersion, '>=13.0.0'),
      getWebpackConfig: async (_baseConfig, _options) => {
        const builderContext = getBuilderContext(_options);
        const builderOptions = await getBuilderOptions(_options, builderContext);
        const legacyDefaultOptions = await getLegacyDefaultBuildOptions(_options);

        return getWebpackConfig13_x_x(_baseConfig, {
          builderOptions: {
            watch: options.configType === 'DEVELOPMENT',
            ...legacyDefaultOptions,
            ...builderOptions,
          },
          builderContext,
        });
      },
    },
    {
      info: '=> Loading angular-cli config for angular 12.2.x',
      condition: semver.satisfies(angularCliVersion, '12.2.x') && options.angularBuilderContext,
      getWebpackConfig: async (_baseConfig, _options) => {
        const builderContext = getBuilderContext(_options);
        const builderOptions = await getBuilderOptions(_options, builderContext);

        return getWebpackConfig12_2_x(_baseConfig, {
          builderOptions,
          builderContext,
        });
      },
    },
    {
      info: '=> Loading angular-cli config for angular lower than 12.2.0',
      condition: true,
      getWebpackConfig: getWebpackConfigOlder,
    },
  ];

  const webpackGetter = webpackGetterByVersions.find((wg) => wg.condition);

  logger.info(webpackGetter.info);
  return Promise.resolve(webpackGetter.getWebpackConfig(baseConfig, options));
}

/**
 * Get Builder Context
 * If storybook is not start by angular builder create dumb BuilderContext
 */
function getBuilderContext(options: PresetOptions): BuilderContext {
  return (
    options.angularBuilderContext ??
    (({
      target: { project: 'noop-project', builder: '', options: {} },
      workspaceRoot: process.cwd(),
      getProjectMetadata: () => ({}),
      getTargetOptions: () => ({}),
      logger: new logging.Logger('Storybook'),
    } as unknown) as BuilderContext)
  );
}

/**
 * Get builder options
 * Merge target options from browser target and from storybook options
 */
async function getBuilderOptions(
  options: PresetOptions,
  builderContext: BuilderContext
): Promise<JsonObject> {
  /**
   * Get Browser Target options
   */
  let browserTargetOptions: JsonObject = {};
  if (options.angularBrowserTarget) {
    const browserTarget = targetFromTargetString(options.angularBrowserTarget);

    logger.info(
      `=> Using angular browser target options from "${browserTarget.project}:${
        browserTarget.target
      }${browserTarget.configuration ? `:${browserTarget.configuration}` : ''}"`
    );
    browserTargetOptions = await builderContext.getTargetOptions(browserTarget);
  }

  /**
   * Merge target options from browser target options and from storybook options
   */
  const builderOptions = {
    ...browserTargetOptions,
    ...(options.angularBuilderOptions as JsonObject),
    tsConfig:
      options.tsConfig ??
      findUpSync('tsconfig.json', { cwd: options.configDir }) ??
      browserTargetOptions.tsConfig,
  };
  logger.info(`=> Using angular project with "tsConfig:${builderOptions.tsConfig}"`);

  return builderOptions;
}

/**
 * Get options from legacy way
 * /!\ This is only for backward compatibility and would be removed on Storybook 7.0
 * only work for angular.json with [defaultProject].build or "storybook.build" config
 */
async function getLegacyDefaultBuildOptions(options: PresetOptions) {
  if (options.angularBrowserTarget !== undefined) {
    // Not use legacy way with builder (`angularBrowserTarget` is defined or null with builder and undefined without)
    return {};
  }

  logger.warn(dedent`Your Storybook startup uses a solution that will not be supported in version 7.0. 
            You must use angular builder to have an explicit configuration on the project used in angular.json
            Read more at:
            - https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#sb-angular-builder)
            - https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#angular13)
          `);
  const dirToSearch = process.cwd();

  // Read angular workspace
  let workspaceConfig;
  try {
    workspaceConfig = await readAngularWorkspaceConfig(dirToSearch);
  } catch (error) {
    logger.error(
      `=> Could not find angular workspace config (angular.json) on this path "${dirToSearch}"`
    );
    logger.info(`=> Fail to load angular-cli config. Using base config`);
    return {};
  }

  // Find angular project target
  try {
    const browserTarget = {
      configuration: undefined,
      project: getDefaultProjectName(workspaceConfig),
      target: 'build',
    } as Target;

    const { target, project } = findAngularProjectTarget(
      workspaceConfig,
      browserTarget.project,
      browserTarget.target
    );

    logger.info(
      `=> Using angular project "${browserTarget.project}:${browserTarget.target}" for configuring Storybook`
    );
    return { ...target.options };
  } catch (error) {
    logger.error(`=> Could not find angular project: ${error.message}`);
    logger.info(`=> Fail to load angular-cli config. Using base config`);
    return {};
  }
}
