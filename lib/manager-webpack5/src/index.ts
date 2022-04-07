import webpack, { ProgressPlugin } from 'webpack';
import type { Stats, Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { logger } from '@storybook/node-logger';
import { useProgressReporting, checkWebpackVersion } from '@storybook/core-common';
import type { Builder, Options } from '@storybook/core-common';

import findUp from 'find-up';
import fs from 'fs-extra';
import express from 'express';
import { getManagerWebpackConfig } from './manager-config';
import { clearManagerCache, useManagerCache } from './utils/manager-cache';
import { getPrebuiltDir } from './utils/prebuilt-manager';

let compilation: ReturnType<typeof webpackDevMiddleware>;
let reject: (reason?: any) => void;

type WebpackBuilder = Builder<Configuration, Stats>;
type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

type BuilderStartOptions = Partial<Parameters<WebpackBuilder['start']>['0']>;
type BuilderStartResult = Unpromise<ReturnType<WebpackBuilder['start']>>;
type StarterFunction = (
  options: BuilderStartOptions
) => AsyncGenerator<unknown, BuilderStartResult, void>;

type BuilderBuildOptions = Partial<Parameters<WebpackBuilder['build']>['0']>;
type BuilderBuildResult = Unpromise<ReturnType<WebpackBuilder['build']>>;
type BuilderFunction = (
  options: BuilderBuildOptions
) => AsyncGenerator<unknown, BuilderBuildResult, void>;

export const WEBPACK_VERSION = '5';

export const getConfig: WebpackBuilder['getConfig'] = getManagerWebpackConfig;

export const makeStatsFromError = (err: string) =>
  ({
    hasErrors: () => true,
    hasWarnings: () => false,
    toJson: () => ({ warnings: [] as any[], errors: [err] }),
  } as any as Stats);

export const executor = {
  get: async (options: Options) => {
    const version = ((await options.presets.apply('webpackVersion')) || WEBPACK_VERSION) as string;
    const webpackInstance =
      (await options.presets.apply<{ default: typeof webpack }>('webpackInstance'))?.default ||
      webpack;
    checkWebpackVersion({ version }, WEBPACK_VERSION, `manager-webpack${WEBPACK_VERSION}`);
    return webpackInstance;
  },
};

let asyncIterator: ReturnType<StarterFunction> | ReturnType<BuilderFunction>;

export const bail: WebpackBuilder['bail'] = async () => {
  if (asyncIterator) {
    try {
      // we tell the builder (that started) to stop ASAP and wait
      await asyncIterator.throw(new Error());
    } catch (e) {
      //
    }
  }
  if (reject) {
    reject();
  }
  // we wait for the compiler to finish it's work, so it's command-line output doesn't interfere
  return new Promise((res, rej) => {
    if (process && compilation) {
      try {
        compilation.close(() => res());
        logger.warn('Force closed manager build');
      } catch (err) {
        logger.warn('Unable to close manager build!');
        res();
      }
    } else {
      res();
    }
  });
};

/**
 * This function is a generator so that we can abort it mid process
 * in case of failure coming from other processes e.g. preview builder
 *
 * I am sorry for making you read about generators today :')
 */
const starter: StarterFunction = async function* starterGeneratorFn({
  startTime,
  options,
  router,
}) {
  const prebuiltDir = await getPrebuiltDir(options);
  if (prebuiltDir && options.managerCache && !options.smokeTest) {
    logger.info('=> Using prebuilt manager');
    router.use('/', express.static(prebuiltDir));
    return;
  }
  yield;

  const config = await getConfig(options);
  yield;

  if (options.cache) {
    // Retrieve the Storybook version number to bust cache on upgrades.
    const packageFile = await findUp('package.json', { cwd: __dirname });
    const { version: storybookVersion } = await fs.readJSON(packageFile);
    const cacheKey = `managerConfig-webpack${WEBPACK_VERSION}@${storybookVersion}`;

    if (options.managerCache) {
      const [useCache, hasOutput] = await Promise.all([
        // useManagerCache sets the cache, so it must run even if outputDir doesn't exist yet,
        // otherwise the 2nd run won't be able to use the manager built on the 1st run.
        useManagerCache(cacheKey, options, config),
        fs.pathExists(options.outputDir),
      ]);
      yield;
      if (useCache && hasOutput && !options.smokeTest) {
        logger.line(1); // force starting new line
        logger.info('=> Using cached manager');
        router.use('/', express.static(options.outputDir));
        return;
      }
    } else if (!options.smokeTest && (await clearManagerCache(cacheKey, options))) {
      yield;
      logger.line(1); // force starting new line
      logger.info('=> Cleared cached manager config');
    }
  }

  const webpackInstance = await executor.get(options);
  yield;
  const compiler = (webpackInstance as any)(config);

  if (!compiler) {
    const err = `${config.name}: missing webpack compiler at runtime!`;
    logger.error(err);
    // eslint-disable-next-line consistent-return
    return {
      bail,
      totalTime: process.hrtime(startTime),
      stats: makeStatsFromError(err),
    };
  }

  const { handler, modulesCount } = await useProgressReporting(router, startTime, options);
  yield;
  new ProgressPlugin({ handler, modulesCount }).apply(compiler);

  const middlewareOptions: Parameters<typeof webpackDevMiddleware>[1] = {
    publicPath: config.output?.publicPath as string,
    writeToDisk: true,
  };

  compilation = webpackDevMiddleware(compiler, middlewareOptions);

  router.use(compilation);

  const stats = await new Promise<Stats>((ready, stop) => {
    compilation.waitUntilValid(ready);
    reject = stop;
  });
  yield;

  if (!stats) {
    throw new Error('no stats after building manager');
  }

  // eslint-disable-next-line consistent-return
  return {
    bail,
    stats,
    totalTime: process.hrtime(startTime),
  };
};

export const start = async (options: BuilderStartOptions) => {
  asyncIterator = starter(options);
  let result;

  do {
    // eslint-disable-next-line no-await-in-loop
    result = await asyncIterator.next();
  } while (!result.done);

  return result.value;
};

/**
 * This function is a generator so that we can abort it mid process
 * in case of failure coming from other processes e.g. preview builder
 *
 * I am sorry for making you read about generators today :')
 */
const builder: BuilderFunction = async function* builderGeneratorFn({ startTime, options }) {
  logger.info('=> Compiling manager..');
  const webpackInstance = await executor.get(options);
  yield;
  const config = await getConfig(options);
  yield;

  const compiler = webpackInstance(config);
  if (!compiler) {
    const err = `${config.name}: missing webpack compiler at runtime!`;
    logger.error(err);
    return Promise.resolve(makeStatsFromError(err));
  }
  yield;

  return new Promise<Stats>((succeed, fail) => {
    compiler.run((error, stats) => {
      if (error || !stats || stats.hasErrors()) {
        logger.error('=> Failed to build the manager');

        if (error) {
          logger.error(error.message);
        }

        if (stats && (stats.hasErrors() || stats.hasWarnings())) {
          const { warnings = [], errors = [] } = stats.toJson({ warnings: true, errors: true });

          errors.forEach((e) => logger.error(e.message));
          warnings.forEach((e) => logger.error(e.message));
        }

        process.exitCode = 1;
        fail(error || stats);
      } else {
        logger.trace({ message: '=> Manager built', time: process.hrtime(startTime) });
        if (stats && stats.hasWarnings()) {
          stats.toJson({ warnings: true }).warnings.forEach((e) => logger.warn(e.message));
        }

        succeed(stats);
      }
    });
  });
};

export const build = async (options: BuilderStartOptions) => {
  asyncIterator = builder(options);
  let result;

  do {
    // eslint-disable-next-line no-await-in-loop
    result = await asyncIterator.next();
  } while (!result.done);

  return result.value;
};

export const corePresets: WebpackBuilder['corePresets'] = [
  require.resolve('./presets/manager-preset'),
];
export const overridePresets: WebpackBuilder['overridePresets'] = [];
