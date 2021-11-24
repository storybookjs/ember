import chalk from 'chalk';
import dedent from 'ts-dedent';
import { ConfigFile, readConfig, writeConfig } from '@storybook/csf-tools';

import { findEslintFile, SUPPORTED_ESLINT_EXTENSIONS } from '../helpers/getEslintInfo';
import { getStorybookInfo } from '../helpers/getStorybookInfo';

import type { Fix } from '../types';

const logger = console;

interface EslintPluginRunOptions {
  main: ConfigFile;
  eslintFile: string;
  unsupportedExtension?: string;
}

/**
 * Does the user not have eslint-plugin-storybook installed?
 *
 * If so:
 * - Install it, and if possible configure it
 */
export const eslintPlugin: Fix<EslintPluginRunOptions> = {
  id: 'eslintPlugin',

  async check({ packageManager }) {
    const packageJson = packageManager.retrievePackageJson();
    const { dependencies, devDependencies } = packageJson;

    const eslintPluginStorybook =
      dependencies['eslint-plugin-storybook'] || devDependencies['eslint-plugin-storybook'];
    const eslintDependency = dependencies.eslint || devDependencies.eslint;

    if (eslintPluginStorybook || !eslintDependency) {
      return null;
    }

    const config = getStorybookInfo(packageJson);

    const { mainConfig } = config;
    if (!mainConfig) {
      logger.warn('Unable to find storybook main.js config, skipping');
      return null;
    }

    let eslintFile;
    let unsupportedExtension;
    try {
      eslintFile = findEslintFile();
    } catch (err) {
      unsupportedExtension = err.message;
    }

    if (!eslintFile && !unsupportedExtension) {
      logger.warn('Unable to find .eslintrc config file, skipping');
      return null;
    }

    // If in the future the eslint plugin has a framework option, using main to extract the framework field will be very useful
    const main = await readConfig(mainConfig);

    return { eslintFile, main, unsupportedExtension };
  },

  prompt() {
    return dedent`
      We've detected you are not using our eslint-plugin.

      In order to have the best experience with Storybook and follow best practices, we advise you to install eslint-plugin-storybook.

      More info: ${chalk.yellow('https://github.com/storybookjs/eslint-plugin-storybook#readme')}
    `;
  },

  async run({ result: { eslintFile, unsupportedExtension }, packageManager, dryRun }) {
    const deps = [`eslint-plugin-storybook`];

    logger.info(`✅ Adding dependencies: ${deps}`);
    if (!dryRun) packageManager.addDependencies({ installAsDevDependencies: true }, deps);

    if (!dryRun && unsupportedExtension) {
      throw new Error(dedent`
          ⚠️ The plugin was successfuly installed but failed to configure.
          
          Found an .eslintrc config file with an unsupported automigration format: ${unsupportedExtension}.
          Supported formats for automigration are: ${SUPPORTED_ESLINT_EXTENSIONS.join(', ')}.

          Please refer to https://github.com/storybookjs/eslint-plugin-storybook#usage to finish setting up the plugin manually.
      `);
    }

    const eslint = await readConfig(eslintFile);
    logger.info(`✅ Configuring eslint rules in ${eslint.fileName}`);

    if (!dryRun) {
      logger.info(`✅ Adding Storybook to extends list`);
      const extendsConfig = eslint.getFieldValue(['extends']) || [];
      const existingConfigValue = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
      eslint.setFieldValue(['extends'], [...existingConfigValue, 'plugin:storybook/recommended']);

      await writeConfig(eslint);
    }
  },
};
