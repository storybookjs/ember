import { StorybookConfig as BaseConfig } from '@storybook/core-common';

/**
 * The interface for Storybook configuration in `main.ts` files.
 */
export interface StorybookConfig extends BaseConfig {
  reactOptions?: {
    fastRefresh?: boolean;
    strictMode?: boolean;
    /**
     * Uses React 18's new root API (ReactDOM.createRoot)
     * The new root API happens to be the gateway for accessing new features of React 18 and adds out-of-the-box improvements.
     */
    newReactRootApi?: boolean;
  };
}
