/// <reference types="node" />

import type { StorybookConfig } from '@storybook/react/types';

const config: StorybookConfig = {
  stories: [
    // FIXME: Breaks e2e tests './intro.stories.mdx',
    '../../lib/ui/src/**/*.stories.@(js|tsx|mdx)',
    '../../lib/components/src/**/*.stories.@(js|tsx|mdx)',
    './stories/**/*.stories.@(js|ts|tsx|mdx)',
    './../../addons/docs/**/*.stories.tsx',
    './../../addons/interactions/**/*.stories.(tsx|mdx)',
  ],
  reactOptions: {
    fastRefresh: true,
    strictMode: true,
  },
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        transcludeMarkdown: true,
        // needed if you use addon-docs in conjunction
        // with addon-storysource
        sourceLoaderOptions: null,
      },
    },
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    '@storybook/addon-links',
    '@storybook/addon-jest',
    '@storybook/addon-a11y',
  ],
  core: {
    builder: 'webpack4',
  },
  logLevel: 'debug',
  features: {
    modernInlineRender: true,
  },
};

module.exports = config;
