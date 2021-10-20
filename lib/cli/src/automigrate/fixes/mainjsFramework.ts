import chalk from 'chalk';
import dedent from 'ts-dedent';

import semver from '@storybook/semver';
import { ConfigFile, readConfig, writeConfig } from '@storybook/csf-tools';

import { getStorybookInfo } from '../helpers/getStorybookInfo';
import { Fix } from '../types';

const logger = console;

interface MainjsFrameworkRunOptions {
  framework: string;
  main: ConfigFile;
}

export const mainjsFramework: Fix<MainjsFrameworkRunOptions> = {
  id: 'mainjsFramework',

  async check({ packageManager }) {
    const packageJson = packageManager.retrievePackageJson();
    const { mainConfig, framework, version: storybookVersion } = getStorybookInfo(packageJson);

    const storybookCoerced = storybookVersion && semver.coerce(storybookVersion)?.version;
    if (!storybookCoerced) {
      logger.warn(dedent`
        ❌ Unable to determine storybook version, skipping ${chalk.cyan('mainjsFramework')} fix.
        🤔 Are you running automigrate from your project directory?
      `);
      return null;
    }

    const main = await readConfig(mainConfig);
    const currentFramework = main.getFieldValue(['framework']);
    const features = main.getFieldValue(['features']);

    if (currentFramework) return null;

    return features?.breakingChangesV7 ||
      features?.storyStoreV7 ||
      semver.gte(storybookCoerced, '7.0.0')
      ? { main, framework: `@storybook/${framework}` }
      : null;
  },

  prompt({ framework }) {
    const frameworkFormatted = chalk.cyan(`framework: '${framework}'`);

    return dedent`
      We've detected that your main.js configuration file does not specify the
      'framework' field, which is a requirement in SB7.0 and above. We can add one
      for you automatically:

      ${frameworkFormatted}

      More info: ${chalk.yellow(
        'https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#mainjs-framework-field'
      )}
    `;
  },

  async run({ result: { main, framework }, dryRun }) {
    logger.info(`✅ Setting 'framework' to '${framework}' in main.js`);
    if (!dryRun) {
      main.setFieldValue(['framework'], framework);
      await writeConfig(main);
    }
  },
};
