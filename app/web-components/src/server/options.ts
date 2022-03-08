import { sync } from 'read-pkg-up';
import type { LoadOptions } from '@storybook/core-common';

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'web-components',
  frameworkPresets: [require.resolve('./framework-preset-web-components')],
} as LoadOptions;
