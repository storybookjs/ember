import { CLIOptions, LoadOptions, BuilderOptions } from '@storybook/core-common';
import { BuilderContext } from '@angular-devkit/architect';
import { JsonValue } from '@angular-devkit/core';
import { JsonSchema } from '@angular-devkit/core/src/json/schema';

export type StandaloneOptions = Partial<
  CLIOptions &
    LoadOptions &
    BuilderOptions & {
      mode?: 'static' | 'dev';
      angularBrowserTarget?: string | null;
      angularBuilderOptions?: JsonObject & {
        styles?: ExtraEntryPoint[];
        stylePreprocessorOptions?: StylePreprocessorOptions;
      };
      angularBuilderContext?: BuilderContext | null;
      tsConfig?: string;
    }
>;

declare module '@storybook/angular/standalone' {
  export default function buildStandalone(options: StandaloneOptions): Promise<unknown>;
}
