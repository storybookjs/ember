import type { StorybookConfig } from '@storybook/react/types';

const path = require('path');

const mainConfig: StorybookConfig = {
  stories: ['../src/**/*.stories.@(tsx|mdx)'],
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/addon-ie11',
    {
      name: '@storybook/addon-essentials',
      options: {
        viewport: false,
      },
    },
  ],
  logLevel: 'debug',
  webpackFinal: async (config) => {
    // add monorepo root as a valid directory to import modules from
    config.resolve?.plugins?.forEach((p: any) => {
      if (Array.isArray(p.appSrcs)) {
        p.appSrcs.push(path.join(__dirname, '..', '..', '..'));
      }
    });
    return config;
  },
  core: {
    builder: 'webpack4',
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  staticDirs: ['../public'],
  features: {
    buildStoriesJson: true,
  },
};

module.exports = mainConfig;
