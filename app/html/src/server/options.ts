import { sync } from 'read-pkg-up';
import type { LoadOptions } from '@storybook/core-common';

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'html',
  frameworkPresets: [require.resolve('./framework-preset-html')],
} as LoadOptions;
