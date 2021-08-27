import { logger } from '@storybook/node-logger';

export const generateStorybookBabelConfig = async () => {
  const cwd = process.cwd();
  logger.info(`Generating the storybook default babel config at ${cwd}`);
};
