import { sync } from 'read-pkg-up';
import { LoadOptions, Options as CoreOptions } from '@storybook/core-common';

import { BuilderContext } from '@angular-devkit/architect';
import { ExtraEntryPoint, StylePreprocessorOptions } from '@angular-devkit/build-angular';

export type PresetOptions = CoreOptions & {
  /* Allow to get the options of a targeted "browser builder"  */
  angularBrowserTarget?: string | null;
  /* Defined set of options. These will take over priority from angularBrowserTarget options  */
  angularBuilderOptions?: {
    styles?: ExtraEntryPoint[];
    stylePreprocessorOptions?: StylePreprocessorOptions;
  };
  /* Angular context from builder */
  angularBuilderContext?: BuilderContext | null;
  tsConfig?: string;
};

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'angular',
  frameworkPresets: [require.resolve('./preset')],
} as LoadOptions;
