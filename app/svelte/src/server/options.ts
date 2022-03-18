import { sync } from 'read-pkg-up';
import { LoadOptions } from '@storybook/core-common';

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'svelte',
  frameworkPresets: [require.resolve('./preset.js')],
} as LoadOptions;
