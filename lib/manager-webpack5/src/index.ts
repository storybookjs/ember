import webpack, { Stats, Configuration, ProgressPlugin } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { logger } from '@storybook/node-logger';
import {
  Builder,
  useProgressReporting,
  checkWebpackVersion,
  Options,
} from '@storybook/core-common';
import { pathExists } from 'fs-extra';
import express from 'express';
import { getManagerWebpackConfig } from './manager-config';
import { clearManagerCache, useManagerCache } from './utils/manager-cache';
import { getPrebuiltDir } from './utils/prebuilt-manager';

let compilation: ReturnType<typeof webpackDevMiddleware>;
let reject: (reason?: any) => void;

type WebpackBuilder = Builder<Configuration, Stats>;

export const getConfig: WebpackBuilder['getConfig'] = getManagerWebpackConfig;

export const makeStatsFromError = (err: string) =>
  (({
    hasErrors: () => true,
    hasWarnings: () => false,
    toJson: () => ({ warnings: [] as any[], errors: [err] }),
  } as any) as Stats);

export const executor = {
  get: async (options: Options) => {
    const version = ((await options.presets.apply('webpackVersion')) || '5') as string;
    const webpackInstance =
      (await options.presets.apply<typeof webpack>('webpackInstance')) || webpack;
    checkWebpackVersion({ version }, '5', 'manager-webpack5');
    return webpackInstance;
  },
};

export const start: WebpackBuilder['start'] = async ({ startTime, options, router }) => {
  const webpackInstance = await executor.get(options);

  const prebuiltDir = await getPrebuiltDir(options);
  const config = await getConfig(options);

  if (options.cache) {
    if (options.managerCache) {
      const [useCache, hasOutput] = await Promise.all([
        // must run even if outputDir doesn't exist, otherwise the 2nd run won't use cache
        useManagerCache(options.cache, config),
        pathExists(options.outputDir),
      ]);
      if (useCache && hasOutput && !options.smokeTest) {
        logger.info('=> Using cached manager');
        // Manager static files
        router.use('/', express.static(prebuiltDir || options.outputDir));

        return;
      }
    } else if (!options.smokeTest && (await clearManagerCache(options.cache))) {
      logger.info('=> Cleared cached manager config');
    }
  }

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

  if (!stats) {
    throw new Error('no stats after building preview');
  }

  // eslint-disable-next-line consistent-return
  return {
    bail,
    stats,
    totalTime: process.hrtime(startTime),
  };
};

export const bail: WebpackBuilder['bail'] = (e: Error) => {
  if (reject) {
    reject();
  }
  if (process) {
    try {
      compilation.close();
      logger.warn('Force closed preview build');
    } catch (err) {
      logger.warn('Unable to close preview build!');
    }
  }
  throw e;
};

export const build: WebpackBuilder['build'] = async ({ options, startTime }) => {
  logger.info('=> Compiling manager..');
  const webpackInstance = await executor.get(options);

  const config = await getConfig(options);

  const compiler = webpackInstance(config);
  if (!compiler) {
    const err = `${config.name}: missing webpack compiler at runtime!`;
    logger.error(err);
    return Promise.resolve(makeStatsFromError(err));
  }

  return new Promise((succeed, fail) => {
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

        // const statsData = stats.toJson(
        //   typeof statsOptions === 'string' ? statsOptions : { ...statsOptions, warnings: true }
        // );
        // statsData?.warnings?.forEach((e) => logger.warn(e));

        succeed(stats);
      }
    });
  });
};

export const corePresets: WebpackBuilder['corePresets'] = [
  require.resolve('./presets/manager-preset'),
];
export const overridePresets: WebpackBuilder['overridePresets'] = [];
