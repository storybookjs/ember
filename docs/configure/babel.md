---
title: 'Babel'
---

Storybook’s webpack config by [default](#default-configuration) sets up [Babel](https://babeljs.io/) for ES6 transpiling.

It has three different modes:

- **CRA** - the mode for Create React App apps specifically
- **V6** - the default mode for version 6.x and below
- **V7** - a new mode slated to become the default in SB7.x

## CRA mode

CRA apps configured with `@storybook/preset-create-react-app` use CRA's babel handling to behave as close as possible to your actual application. None of the other documentation on this page applies.

## V6 mode

Storybook works with evergreen browsers by default.

If you want to run Storybook in IE11, make sure to [disable](../essentials/introduction#disabling-addons) the docs-addon that is part of `@storybook/addon-essentials`, as this currently [causes issues in IE11](https://github.com/storybookjs/storybook/issues/8884).

Here are some key features of Storybook's Babel configurations.

### Default configuration

We have added ES2016 support with Babel for transpiling your JS code.

In addition to that, we've added a few additional features, like object spreading and async await.

Check out our [source](https://github.com/storybookjs/storybook/blob/next/lib/core-common/src/utils/babel.ts) to learn more about these plugins.

### Custom config file

If your project has a `.babelrc` file, we'll use that instead of the default config file.

You can also place a `.storybook/.babelrc` file to use a special configuration for Storybook only.

### Custom configuration

If you need to further configure/extend the babel config Storybook uses, you can use the `babel` field of [`.storybook/main.js`](./overview#configure-your-storybook-project):

```js
// .storybook/main.js

module.exports = {
  //...
  babel: async (options) => ({
    ...options,
    // any extra options you want to set
  }),
};
```

## V7 Mode

V7 mode is a new option available in Storybook 6.4+ behind a feature flag.

Its goal is to make Babel configuration simpler, less buggy, easier to troubleshoot, and more consistent with the rest of the JS ecosystem.

In V7 mode, you are responsible for configuring Babel using your `.babelrc` file and Storybook does not provide any default. Storybook's frameworks and addons may provide small programmatic modifications to the babel configuration.

### Activating

To activate V7 mode, set the feature flag in your `.storybook/main.js` config:

```js
module.exports = {
  // ... your existing config
  features: {
    babelModeV7: true,
  },
};
```

### Migrating from V6

For detailed instructions on how to migrate from `V6` mode please see [MIGRATION.md](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#babel-mode-v7).

### Generate a babelrc

If your app does not use a babelrc and you need one, you can generate a babelrc file by running the following command in your project directory:

```sh
npx sb@next babelrc
```

This will create a `.babelrc.json` file. You may need to add package dependencies.

### Troubleshooting

To troubleshoot your babel configuration, set the `BABEL_SHOW_CONFIG_FOR` environment variable.

For example, to see how Storybook is transpiling your `.storybook/preview.js` config:

```sh
BABEL_SHOW_CONFIG_FOR=.storybook/preview.js yarn storybook
```

This will print out the babel configuration for `.storybook/preview.js`, which can be used to debug when files fail to transpile or transpile incorrectly.

> NOTE: Due to what appears to be a Babel bug, setting this flag causes Babel transpilation to fail on the file provided. Thus you cannot actually _RUN_ storybook using this command. However, it will print out the configuration information as advertised and thus you can use this to debug your Storybook. You'll need to remove the flag to actually run your Storybook.

For more info, please refer to the [Babel documentation](https://babeljs.io/docs/en/configuration#print-effective-configs).
