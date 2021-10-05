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

export const automigrate = async ({ fixId, dryRun, yes }: FixOptions) => {
  const packageManager = JsPackageManagerFactory.getPackageManager();
  const filtered = fixId ? fixes.filter((f) => f.id === fixId) : fixes;

  for (let i = 0; i < filtered.length; i += 1) {
    const f = fixes[i] as Fix;
    logger.info(`🔎 checking '${chalk.cyan(f.id)}'`);
    const result = await f.check({ packageManager });
    if (result) {
      const message = f.prompt(result);

      logger.info(
        boxen(message, { borderStyle: 'round', padding: 1, borderColor: '#F1618C' } as any)
      );

      const runAnswer =
        yes || dryRun
          ? { fix: false }
          : await prompts([
              {
                type: 'confirm',
                name: 'fix',
                message: `Do you want to run the '${chalk.cyan(f.id)}' fix on your project?`,
              },
            ]);

      if (runAnswer.fix) {
        await f.run({ result, packageManager, dryRun });
        logger.info(`✅ fixed ${chalk.cyan(f.id)}`);
      } else {
        logger.info(`Skipping the ${chalk.cyan(f.id)} fix.`);
        logger.info();
        logger.info(`If you change your mind, run '${chalk.cyan('npx sb@next fix')}'`);
      }
    }
  }
};
