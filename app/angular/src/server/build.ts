import { buildStatic } from '@storybook/core/server';
import { logger } from '@storybook/node-logger';
import options from './options';

async function build() {
  try {
    await buildStatic(options);
  } catch (error) {
    logger.error(error);
  }
}

build();
