import chalk from 'chalk';
import dedent from 'ts-dedent';
import semver from '@storybook/semver';
import { ConfigFile, readConfig, writeConfig } from '@storybook/csf-tools';
import { Fix } from '../types';
import { getStorybookInfo } from '../helpers/getStorybookInfo';
import { PackageJsonWithDepsAndDevDeps } from '../../js-package-manager';

const logger = console;

interface Webpack5RunOptions {
  webpackVersion: string;
  storybookVersion: string;
  main: ConfigFile;
}

interface CheckBuilder {
  checkWebpack5Builder: (
    packageJson: PackageJsonWithDepsAndDevDeps
  ) => Promise<{ storybookVersion: string; main: ConfigFile }>;
}

/**
 * Is the user using webpack5 in their project?
 *
 * If the user is using a version of SB >= 6.3,
 * prompt them to upgrade to webpack5.
 *
 * - Add manager-webpack5 builder-webpack5 as dev dependencies
 * - Add core.builder = 'webpack5' to main.js
 * - Add 'webpack5' as a project dependency
 */
export const webpack5: Fix<Webpack5RunOptions> & CheckBuilder = {
  id: 'webpack5',

  async checkWebpack5Builder(packageJson: PackageJsonWithDepsAndDevDeps) {
    const { mainConfig, version: storybookVersion } = getStorybookInfo(packageJson);

    const storybookCoerced = storybookVersion && semver.coerce(storybookVersion)?.version;
    if (!storybookCoerced) {
      logger.warn(dedent`
        ❌ Unable to determine storybook version, skipping ${chalk.cyan('webpack5')} fix.
        🤔 Are you running automigrate from your project directory?
      `);
      return null;
    }

    if (semver.lt(storybookCoerced, '6.3.0')) {
      logger.warn(
        dedent`
          Detected SB 6.3 or below, please upgrade storybook to use webpack5.

          To upgrade to the latest stable release, run this from your project directory:

          ${chalk.cyan('npx sb upgrade')}

          Add the ${chalk.cyan('--prerelease')} flag to get the latest prerelease.
        `.trim()
      );
      return null;
    }

    if (semver.gte(storybookCoerced, '7.0.0')) {
      return null;
    }

    if (!mainConfig) {
      logger.warn('Unable to find storybook main.js config');
      return null;
    }
    const main = await readConfig(mainConfig);
    const builder = main.getFieldValue(['core', 'builder']);
    if (builder && builder !== 'webpack4') {
      logger.info(`Found builder ${builder}, skipping`);
      return null;
    }

    return { storybookVersion, main };
  },

  async check({ packageManager }) {
    const packageJson = packageManager.retrievePackageJson();
    const { dependencies, devDependencies } = packageJson;

    const webpackVersion = dependencies.webpack || devDependencies.webpack;
    const webpackCoerced = semver.coerce(webpackVersion)?.version;

    if (
      !webpackCoerced ||
      semver.lt(webpackCoerced, '5.0.0') ||
      semver.gte(webpackCoerced, '6.0.0')
    )
      return null;

    const builderInfo = await this.checkWebpack5Builder(packageJson);
    return builderInfo ? { webpackVersion, ...builderInfo } : null;
  },

  prompt({ webpackVersion, storybookVersion }) {
    const webpackFormatted = chalk.cyan(`webpack ${webpackVersion}`);
    const sbFormatted = chalk.cyan(`Storybook ${storybookVersion}`);

    return dedent`
      We've detected you're running ${webpackFormatted}.
      ${sbFormatted} runs webpack4 by default, which may not be compatible.
      
      To run Storybook in webpack5-mode, we can install Storybook's ${chalk.cyan(
        'webpack5 builder'
      )} for you.

      More info: ${chalk.yellow(
        'https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#webpack-5-manager-build'
      )}
    `;
  },

  async run({ result: { main, storybookVersion, webpackVersion }, packageManager, dryRun }) {
    const deps = [
      `@storybook/manager-webpack5@${storybookVersion}`,
      `@storybook/builder-webpack5@${storybookVersion}`,
    ];
    // this also gets called by 'cra5' fix so we need to add
    // webpack5 at the project root so that it gets hoisted
    if (!webpackVersion) {
      deps.push('webpack@5');
    }
    logger.info(`✅ Adding dependencies: ${deps}`);
    if (!dryRun) packageManager.addDependencies({ installAsDevDependencies: true }, deps);

    logger.info('✅ Setting `core.builder` to `webpack5` in main.js');
    if (!dryRun) {
      main.setFieldValue(['core', 'builder'], 'webpack5');
      await writeConfig(main);
    }
  },
};
