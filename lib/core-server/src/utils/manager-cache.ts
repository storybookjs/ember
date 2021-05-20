import { Options } from '@storybook/core-common';
import { logger } from '@storybook/node-logger';
import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';
import { stringify } from 'telejson';
import webpack from 'webpack';
import { FileSystemCache } from 'file-system-cache';

// The main config file determines the managerConfig value, so is already handled.
// The other files don't affect the manager, so can be safely ignored.
const ignoredConfigFiles = [/^main\.(m?js|ts)$/, /^preview\.(m?js|ts)$/, /^preview-head\.html$/];

export const useManagerCache = async (options: Options, managerConfig: webpack.Configuration) => {
  // Retrieve the Storybook version number to bust cache up upgrades.
  const packageFile = await findUp('package.json', { cwd: __dirname });
  const { version: storybookVersion } = await fs.readJSON(packageFile);
  const cacheKey = `managerConfig@${storybookVersion}`;

  const [cachedISOTime, cachedConfig] = await options.cache
    .get(cacheKey)
    .then((str) => str.match(/^([0-9TZ.:+-]+)_(.*)/).slice(1))
    .catch(() => []);

  // Drop the `cache` property because it'll change as a result of writing to the cache.
  const { cache: _, ...baseConfig } = managerConfig;
  const configString = stringify(baseConfig);
  await options.cache.set(cacheKey, `${new Date().toISOString()}_${configString}`);
  if (configString !== cachedConfig || !cachedISOTime) {
    logger.line(1); // force starting new line
    logger.info('=> Ignoring cached manager due to change in manager config');
    return false;
  }

  // Check the modification time for all files in the config dir (.storybook) and
  // don't use the cache if any file has been modified since the cache was created.
  const configFiles = await fs.readdir(options.configDir);
  const cacheCreationDate = new Date(cachedISOTime);
  try {
    await Promise.all(
      configFiles.map(async (file) => {
        if (ignoredConfigFiles.some((pattern) => pattern.test(file))) return;
        const filepath = path.join(options.configDir, file);
        const { mtime: fileModificationDate } = await fs.stat(filepath);
        if (fileModificationDate > cacheCreationDate) throw filepath;
      })
    );
    return true;
  } catch (e) {
    if (e instanceof Error) throw e;
    logger.line(1); // force starting new line
    logger.info(`=> Ignoring cached manager due to change in ${e}`);
    return false;
  }
};

export const clearManagerCache = async (fsc: FileSystemCache) => {
  if (fsc && fsc.fileExists('managerConfig')) {
    await fsc.remove('managerConfig');
    return true;
  }
  return false;
};
