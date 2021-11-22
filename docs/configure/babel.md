---
title: 'Babel'
---

Storybook’s webpack config by [default](#default-configuration) sets up [Babel](https://babeljs.io/) for ES6 transpiling.

It has three different modes:

- [**CRA**](#cra-mode) - the mode for Create React App apps specifically
- [**V6**](#v6-mode) - the default mode for version 6.x and below
- [**V7**](#v7-mode) - a new mode slated to become the default in SB7.x

## CRA mode

[CRA](https://create-react-app.dev/) apps configured with `@storybook/preset-create-react-app` use CRA's babel handling to behave as close as possible to your actual application. None of the other documentation on this page applies.

## V6 mode

Storybook works with evergreen browsers by default.

If you want to run Storybook in IE11, make sure to [disable](../essentials/introduction#disabling-addons) the docs-addon that is part of `@storybook/addon-essentials`, as this currently [causes issues in IE11](https://github.com/storybookjs/storybook/issues/8884).

Here are some key features of Storybook's Babel configurations.

### Default configuration

We have added ES2016 support with Babel for transpiling your JS code.

In addition to that, we've added a few additional features, like [object spreading](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) and [`async` `await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

Check out our [source](https://github.com/storybookjs/storybook/blob/next/lib/core-common/src/utils/babel.ts) to learn more about these plugins.

### Custom config file

If your project has a `.babelrc` file, we'll use that instead of the default config file.

You can also place a `.storybook/.babelrc` file to use a unique configuration for Storybook only.

### Custom configuration

If you need, you can customize the default Babel configuration used by Storybook. Update your [`.storybook/main.js`](./overview#configure-your-storybook-project) and add the `babel` field with the options you want to use:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-custom-babel-config.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## V7 Mode

V7 mode is a new option available in Storybook 6.4+ behind a feature flag.

Its goal is to make the Babel configuration simpler, less buggy, easier to troubleshoot, and more consistent with the rest of the JS ecosystem.

In V7 mode, you are responsible for configuring Babel using your `.babelrc` file, and Storybook does not provide any default. Storybook's frameworks and addons may provide minor programmatic modifications to the babel configuration.

### How it works

To activate V7 mode, set the feature flag in your `.storybook/main.js` config:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-babel-mode-v7.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Migrating from V6

For detailed instructions on migrating from `V6` mode, please see [MIGRATION.md](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#babel-mode-v7).

### Generate a babelrc

If your app does not include a babelrc file, and you need one, you can create it by running the following command in your project directory:

```sh
npx sb@next babelrc
```

Once the command completes, you should have a `.babelrc.json` file created in the root directory of your project, similar to the following example:

```json
{
  "sourceType": "unambiguous",
  "presets": [
    [
      "@babel/preset-env",
      {
        "shippedProposals": true,
        "loose": true
      }
    ],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-transform-shorthand-properties",
    "@babel/plugin-transform-block-scoping",
    [
      "@babel/plugin-proposal-decorators",
      {
        "legacy": true
      }
    ],
    [
      "@babel/plugin-proposal-class-properties",
      {
        "loose": true
      }
    ],
    [
      "@babel/plugin-proposal-private-methods",
      {
        "loose": true
      }
    ],
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-syntax-dynamic-import",
    [
      "@babel/plugin-proposal-object-rest-spread",
      {
        "loose": true,
        "useBuiltIns": true
      }
    ],
    "@babel/plugin-transform-classes",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-parameters",
    "@babel/plugin-transform-destructuring",
    "@babel/plugin-transform-spread",
    "@babel/plugin-transform-for-of",
    "babel-plugin-macros",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    [
      "babel-plugin-polyfill-corejs3",
      {
        "method": "usage-global",
        "absoluteImports": "core-js",
        "version": "3.18.3"
      }
    ]
  ]
}
```

Depending on your environment, you may need to install additional package dependencies.

### Troubleshooting

To troubleshoot your babel configuration, set the `BABEL_SHOW_CONFIG_FOR` environment variable. For example, to see how Storybook is transpiling your `.storybook/preview.js` file, add the following environment variable:

```sh
BABEL_SHOW_CONFIG_FOR=.storybook/preview.js yarn storybook
```

When the command finishes running, it will display the available babel configuration for the `.storybook/preview.js` file. You can use this information to debug issues with transpilation.

> NOTE: Due to what appears to be a Babel bug, setting this flag causes Babel transpilation to fail on the file provided. Thus you cannot actually _RUN_ Storybook using this command. However, it will print out the configuration information as advertised, and therefore you can use this to debug your Storybook. You'll need to remove the flag to actually run your Storybook.

For more info, please refer to the [Babel documentation](https://babeljs.io/docs/en/configuration#print-effective-configs).