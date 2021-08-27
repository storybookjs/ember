import { writeFile, access } from 'fs-extra';
import { logger } from '@storybook/node-logger';
import { getStorybookBabelConfig } from '@storybook/core-common';
import path from 'path';
import prompts from 'prompts';

export const generateStorybookBabelConfigInCWD = async () => {
  const target = process.cwd();
  return generateStorybookBabelConfig({ target });
};
export const generateStorybookBabelConfig = async ({ target }: { target: string }) => {
  logger.info(`Generating the storybook default babel config at ${target}`);

  const config = getStorybookBabelConfig({ local: true });
  const contents = JSON.stringify(config, null, 2);

  const fileName = '.babelrc.json';
  const location = path.join(target, fileName);

  const exists = await access(location).then(
    () => true,
    () => false
  );

  if (exists) {
    const { overwrite } = await prompts({
      type: 'confirm',
      initial: true,
      name: 'overwrite',
      message: `${fileName} already exists. Would you like overwrite it?`,
    });

    if (overwrite === false) {
      logger.warn(`Cancelled, babel config file was NOT written to file-system.`);
      return;
    }
  }

  logger.info(`Writing file to ${location}`);
  await writeFile(location, contents);
};
