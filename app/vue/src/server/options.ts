import { sync } from 'read-pkg-up';
import { LoadOptions } from '@storybook/core-common';

export default {
  packageJson: sync({ cwd: __dirname }).packageJson,
  framework: 'vue',
  frameworkPresets: [
    require.resolve('./framework-preset-vue.js'),
    require.resolve('./framework-preset-vue-docs.js'),
  ],
} as LoadOptions;
