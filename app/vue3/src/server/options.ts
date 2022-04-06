import { sync } from 'read-pkg-up';
import type { LoadOptions } from '@storybook/core-common';

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'vue3',
  frameworkPresets: [require.resolve('./preset')],
} as LoadOptions;
