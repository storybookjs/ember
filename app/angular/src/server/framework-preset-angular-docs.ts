import path from 'path';
import { StorybookConfig } from '@storybook/core-common';

export const config: StorybookConfig['config'] = (entry = [], options) => {
  console.log({ options });
  return [...entry, path.join(__dirname, '../../../dist/ts3.9/client/docs/config')];
};
