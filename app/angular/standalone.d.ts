import { CLIOptions, LoadOptions, BuilderOptions } from '@storybook/core-common';
import { BuilderContext } from '@angular-devkit/architect';

export type StandaloneOptions = Partial<
  CLIOptions &
    LoadOptions &
    BuilderOptions & {
      mode?: 'static' | 'dev';
      angularBrowserTarget?: string | null;
      angularBuilderContext?: BuilderContext | null;
      tsConfig?: string;
    }
>;

declare module '@storybook/angular/standalone' {
  export default function buildStandalone(options: StandaloneOptions): Promise<unknown>;
}
