import { CLIOptions, LoadOptions, BuilderOptions } from '@storybook/core-common';

export type StandaloneOptions = Partial<
  CLIOptions &
    LoadOptions &
    BuilderOptions & {
      angularBrowserTarget: string;
    }
>;

declare module '@storybook/angular/standalone' {
  export default function buildStandalone(options: StandaloneOptions): Promise<unknown>;
}
