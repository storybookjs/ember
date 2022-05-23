/* eslint-disable no-await-in-loop */
import prompts from 'prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import { JsPackageManagerFactory } from '../js-package-manager';

import { fixes, Fix } from './fixes';

const logger = console;

interface FixOptions {
  fixId?: string;
  yes?: boolean;
  dryRun?: boolean;
}

export const automigrate = async ({ fixId, dryRun, yes }: FixOptions = {}) => {
  const packageManager = JsPackageManagerFactory.getPackageManager();
  const filtered = fixId ? fixes.filter((f) => f.id === fixId) : fixes;

  logger.info('🔎 checking possible migrations..');

  for (let i = 0; i < filtered.length; i += 1) {
    const f = fixes[i] as Fix;
    const result = await f.check({ packageManager });
    if (result) {
      logger.info(`🔎 found a '${chalk.cyan(f.id)}' migration:`);
      logger.info();
      const message = f.prompt(result);

      logger.info(
        boxen(message, { borderStyle: 'round', padding: 1, borderColor: '#F1618C' } as any)
      );

      let runAnswer: { fix: boolean };

      if (dryRun) {
        runAnswer = { fix: false };
      } else if (yes) {
        runAnswer = { fix: true };
      } else {
        runAnswer = await prompts({
          type: 'confirm',
          name: 'fix',
          message: `Do you want to run the '${chalk.cyan(f.id)}' migration on your project?`,
        });
      }

      if (runAnswer.fix) {
        try {
          await f.run({ result, packageManager, dryRun });
          logger.info(`✅ ran ${chalk.cyan(f.id)} migration`);
        } catch (error) {
          logger.info(`❌ error when running ${chalk.cyan(f.id)} migration:`);
          logger.info(error.message);
          logger.info();
        }
      } else {
        logger.info(`Skipping the ${chalk.cyan(f.id)} migration.`);
        logger.info();
        logger.info(
          `If you change your mind, run '${chalk.cyan('npx storybook@next automigrate')}'`
        );
      }
    }
  }

  logger.info();
  logger.info('✅ migration check successfully ran');
  logger.info();
};
