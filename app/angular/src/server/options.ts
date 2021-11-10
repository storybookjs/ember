import { sync } from 'read-pkg-up';
import { LoadOptions, Options as CoreOptions } from '@storybook/core-common';

import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

export type PresetOptions = CoreOptions & {
  /* Allow to get the options of a targeted "browser builder"  */
  angularBrowserTarget?: string | null;
  /* Defined set of options. These will take over priority from angularBrowserTarget options  */
  angularBuilderOptions?: JsonObject | null;
  /* Angular context from builder */
  angularBuilderContext?: BuilderContext | null;
  tsConfig?: string;
};

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'angular',
  frameworkPresets: [require.resolve('./preset')],
} as LoadOptions;
