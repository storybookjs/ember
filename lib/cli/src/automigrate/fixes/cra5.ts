import chalk from 'chalk';
import dedent from 'ts-dedent';
import semver from '@storybook/semver';
import { ConfigFile } from '@storybook/csf-tools';
import { Fix } from '../types';
import { webpack5 } from './webpack5';

interface CRA5RunOptions {
  craVersion: string;
  // FIXME craPresetVersion: string;
  storybookVersion: string;
  main: ConfigFile;
}

/**
 * Is the user upgrading from CRA4 to CRA5?
 *
 * If so:
 * - Run webpack5 fix
 */
export const cra5: Fix<CRA5RunOptions> = {
  id: 'cra5',

  async check({ packageManager }) {
    const packageJson = packageManager.retrievePackageJson();
    const { dependencies, devDependencies } = packageJson;
    const craVersion = dependencies['react-scripts'] || devDependencies['react-scripts'];
    const craCoerced = semver.coerce(craVersion)?.version;

    if (!craCoerced || semver.lt(craCoerced, '5.0.0')) {
      return null;
    }

    const builderInfo = await webpack5.checkWebpack5Builder(packageJson);
    return builderInfo ? { craVersion, ...builderInfo } : null;
  },

  prompt({ craVersion, storybookVersion }) {
    const craFormatted = chalk.cyan(`Create React App (CRA) ${craVersion}`);
    const sbFormatted = chalk.cyan(`Storybook ${storybookVersion}`);
    return dedent`
      We've detected you are running ${craFormatted} which is powered by webpack5.
      ${sbFormatted} runs webpack4 by default, which is incompatible.

      In order to work with your version of CRA, we need to install Storybook's ${chalk.cyan(
        'webpack5 builder'
      )}.

      More info: ${chalk.yellow(
        'https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#cra5-upgrade'
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
