import { StorybookConfig as BaseConfig } from '@storybook/core-common';

export interface StorybookConfig extends BaseConfig {
  angularOptions?: {
    enableIvy: boolean;
  };
}
