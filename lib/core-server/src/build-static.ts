import chalk from 'chalk';
import cpy from 'cpy';
import fs from 'fs-extra';
import path from 'path';
import dedent from 'ts-dedent';

import { logger } from '@storybook/node-logger';

import {
  loadAllPresets,
  LoadOptions,
  CLIOptions,
  BuilderOptions,
  Options,
  Builder,
  StorybookConfig,
  cache,
  normalizeStories,
  logConfig,
  CoreConfig,
} from '@storybook/core-common';

import { getProdCli } from './cli';
import { outputStats } from './utils/output-stats';
import {
  copyAllStaticFiles,
  copyAllStaticFilesRelativeToMain,
} from './utils/copy-all-static-files';
import { getPreviewBuilder } from './utils/get-preview-builder';
import { getManagerBuilder } from './utils/get-manager-builder';
import { extractStoriesJson } from './utils/stories-json';

export async function buildStaticStandalone(options: CLIOptions & LoadOptions & BuilderOptions) {
  /* eslint-disable no-param-reassign */
  options.configType = 'PRODUCTION';

  if (options.outputDir === '') {
    throw new Error("Won't remove current directory. Check your outputDir!");
  }

  if (options.staticDir?.includes('/')) {
    throw new Error("Won't copy root directory. Check your staticDirs!");
  }

  options.outputDir = path.isAbsolute(options.outputDir)
    ? options.outputDir
    : path.join(process.cwd(), options.outputDir);
  options.configDir = path.resolve(options.configDir);
  /* eslint-enable no-param-reassign */

  const defaultFavIcon = require.resolve('./public/favicon.ico');

  logger.info(chalk`=> Cleaning outputDir: {cyan ${options.outputDir}}`);
  if (options.outputDir === '/') {
    throw new Error("Won't remove directory '/'. Check your outputDir!");
  }
  await fs.emptyDir(options.outputDir);

  await cpy(defaultFavIcon, options.outputDir);

  const previewBuilder: Builder<unknown, unknown> = await getPreviewBuilder(options.configDir);
  const managerBuilder: Builder<unknown, unknown> = await getManagerBuilder(options.configDir);

  const presets = loadAllPresets({
    corePresets: [
      require.resolve('./presets/common-preset'),
      ...managerBuilder.corePresets,
      ...previewBuilder.corePresets,
      require.resolve('./presets/babel-cache-preset'),
    ],
    overridePresets: previewBuilder.overridePresets,
    ...options,
  });

  const staticDirs = await presets.apply<StorybookConfig['staticDirs']>('staticDirs');

  if (staticDirs && options.staticDir) {
    throw new Error(dedent`
      Conflict when trying to read staticDirs:
      * Storybook's configuration option: 'staticDirs'
      * Storybook's CLI flag: '--staticDir' or '-s'
      
      Choose one of them, but not both.
    `);
  }

  if (staticDirs) {
    await copyAllStaticFilesRelativeToMain(staticDirs, options.outputDir, options.configDir);
  }
  if (options.staticDir) {
    await copyAllStaticFiles(options.staticDir, options.outputDir);
  }

  const features = await presets.apply<StorybookConfig['features']>('features');
  if (features?.buildStoriesJson || features?.storyStoreV7) {
    const directories = {
      configDir: options.configDir,
      workingDir: process.cwd(),
    };
    const stories = normalizeStories(await presets.apply('stories'), directories);
    await extractStoriesJson(path.join(options.outputDir, 'stories.json'), stories, {
      ...directories,
      storiesV2Compatibility: !features?.breakingChangesV7 && !features?.storyStoreV7,
      storyStoreV7: features?.storyStoreV7,
    });
  }

  const fullOptions: Options = {
    ...options,
    presets,
    features,
  };

  if (options.debugWebpack) {
    logConfig('Preview webpack config', await previewBuilder.getConfig(fullOptions));
    logConfig('Manager webpack config', await managerBuilder.getConfig(fullOptions));
  }

  const core = await presets.apply<CoreConfig | undefined>('core');
  const builderName = typeof core?.builder === 'string' ? core.builder : core?.builder?.name;
  const { getPrebuiltDir } =
    builderName === 'webpack5'
      ? await import('@storybook/manager-webpack5/prebuilt-manager')
      : await import('@storybook/manager-webpack4/prebuilt-manager');

  const prebuiltDir = await getPrebuiltDir(fullOptions);

  const startTime = process.hrtime();
  // When using the prebuilt manager, we straight up copy it into the outputDir instead of building it
  const manager = prebuiltDir
    ? cpy('**', options.outputDir, { cwd: prebuiltDir, parents: true }).then(() => {})
    : managerBuilder.build({ startTime, options: fullOptions });

  if (options.ignorePreview) {
    logger.info(`=> Not building preview`);
  }

  const preview = options.ignorePreview
    ? Promise.resolve()
    : previewBuilder.build({
        startTime,
        options: fullOptions,
      });

  const [managerStats, previewStats] = await Promise.all([manager, preview]);

  if (options.webpackStatsJson) {
    const target = options.webpackStatsJson === true ? options.outputDir : options.webpackStatsJson;
    await outputStats(target, previewStats, managerStats);
  }

  logger.info(`=> Output directory: ${options.outputDir}`);
}

export async function buildStatic({ packageJson, ...loadOptions }: LoadOptions) {
  const cliOptions = getProdCli(packageJson);

  try {
    await buildStaticStandalone({
      ...cliOptions,
      ...loadOptions,
      packageJson,
      configDir: loadOptions.configDir || cliOptions.configDir || './.storybook',
      outputDir: loadOptions.outputDir || cliOptions.outputDir || './storybook-static',
      ignorePreview:
        (!!loadOptions.ignorePreview || !!cliOptions.previewUrl) && !cliOptions.forceBuildPreview,
      docsMode: !!cliOptions.docs,
      configType: 'PRODUCTION',
      cache,
    });
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}
