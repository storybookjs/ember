module.exports = {
  stories: ['../src/**/*.stories.@(ts|mdx)'],
  logLevel: 'debug',
  addons: ['@storybook/addon-docs', '@storybook/addon-controls'],
  core: {
    builder: 'webpack4',
  },
  angularOptions: {
    enableIvy: true,
  },
  refs: {
    first: {
      title: 'First storybook',
      url: 'https://storybookjs.netlify.app/angular-cli',
    },
    second: {
      title: 'Second storybook',
      url: 'https://storybookjs.netlify.app/angular-cli',
    },
    third: {
      title: 'Third storybook',
      url: 'https://storybookjs.netlify.app/angular-cli',
    },
  },
};
