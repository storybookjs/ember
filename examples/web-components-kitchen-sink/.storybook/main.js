module.exports = {
  logLevel: 'debug',
  stories: ['../src/**/*.stories.@(ts|mdx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-storysource',
    '@storybook/addon-viewport',
    '@storybook/addon-toolbars',
  ],
  core: {
    builder: 'webpack4',
  },
};
