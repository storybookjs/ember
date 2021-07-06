module.exports = {
  // this dirname is because we run tests from project root
  stories: ['../stories/**/*.stories.*'],
  logLevel: 'debug',
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-jest',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'), // eslint-disable-line global-require
        },
      },
    },
    '@storybook/addon-storysource',
    '@storybook/addon-viewport',
  ],
  core: {
    builder: 'webpack4',
  },
  // Test code for built-in stories.json extraction
  //
  // refs: {
  //   'react-ts': {
  //     title: 'React TS',
  //     // development
  //     url: 'http://localhost:9011',
  //     // production
  //     // url: 'http://localhost:8080',
  //   },
  // },
};
