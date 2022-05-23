import chalk from 'chalk';
import dedent from 'ts-dedent';
import semver from '@storybook/semver';
import { ConfigFile } from '@storybook/csf-tools';
import { Fix } from '../types';
import { webpack5 } from './webpack5';

interface Vue3RunOptions {
  vueVersion: string;
  storybookVersion: string;
  main: ConfigFile;
}

/**
 * Is the user upgrading to Vue3?
 *
 * If so:
 * - Run webpack5 fix
 */
export const vue3: Fix<Vue3RunOptions> = {
  id: 'vue3',

  async check({ packageManager }) {
    const packageJson = packageManager.retrievePackageJson();
    const { dependencies, devDependencies } = packageJson;
    const vueVersion = dependencies.vue || devDependencies.vue;
    const vueCoerced = semver.coerce(vueVersion)?.version;

    if (!vueCoerced || semver.lt(vueCoerced, '3.0.0')) {
      return null;
    }

    const builderInfo = await webpack5.checkWebpack5Builder(packageJson);
    return builderInfo ? { vueVersion, ...builderInfo } : null;
  },

  prompt({ vueVersion, storybookVersion }) {
    const vueFormatted = chalk.cyan(`Vue ${vueVersion}`);
    const sbFormatted = chalk.cyan(`Storybook ${storybookVersion}`);
    return dedent`
      We've detected you are running ${vueFormatted} with Storybook.
      ${sbFormatted} runs webpack4 by default, which is incompatible.

      In order to work with your version of Vue, we need to install Storybook's ${chalk.cyan(
        'webpack5 builder'
      )}.

      More info: ${chalk.yellow(
        'https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#vue3-upgrade'
      )}
    `;
  },

  async run(options) {
    return webpack5.run({
      ...options,
      result: { webpackVersion: null, ...options.result },
    });
  },
};
