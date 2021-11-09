import { sync } from 'read-pkg-up';
import { LoadOptions, Options as CoreOptions } from '@storybook/core-common';

import { BuilderContext } from '@angular-devkit/architect';

export type PresetOptions = CoreOptions & {
  angularBrowserTarget?: string;
  angularBuilderContext?: BuilderContext | null;
  tsConfig?: string;
};

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'angular',
  frameworkPresets: [require.resolve('./preset')],
} as LoadOptions;
