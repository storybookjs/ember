---
title: 'Configure Storybook'
---

Storybook is configured via a folder called `.storybook`, which contains various configuration files.

<div class="aside">

Note that you can change the folder that Storybook uses by setting the `-c` flag to your `start-storybook` and `build-storybook` scripts.

</div>

## Configure your Storybook project

The main configuration file is `main.js`. This file controls the Storybook server's behavior, so you must restart Storybook’s process when you change it. It contains the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-default-setup.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The `main.js` configuration file is a [preset](../addons/addon-types.md) and, as such, has a powerful interface, but the key fields within it are:

- `stories` - an array of globs that indicates the [location of your story files](#configure-story-loading), relative to `main.js`.
- `addons` - a list of the [addons](/addons) you are using.
- `webpackFinal` - custom [webpack configuration](./webpack.md#extending-storybooks-webpack-config).
- `babel` - custom [babel configuration](./babel.md).
- `framework` - framework specific configurations to help the loading and building process.

<div class="aside">
 💡 Tip: Customize your default story by referencing it first in the `stories` array.
</div>

See all the [available](#using-storybook-api) fields below if you need further customization.

### Feature flags

Additionally, you can also provide additional feature flags to your Storybook configuration. Below is an abridged list of available features that are currently available.

| Configuration element | Description                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storyStoreV7`        | Configures Storybook to load stories [on demand](#on-demand-story-loading), rather than during boot up. <br/> `features: { storyStoreV7: true }`                                                                                     |
| `buildStoriesJson`    | Generates a `stories.json` file to help story loading with the on demand mode. <br/> `features: { buildStoriesJson: true }`                                                                           |
| `emotionAlias`        | Provides backwards compatibility for Emotion. See the [migration documentation](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#emotion11-quasi-compatibility) for context.<br/> `features: { emotionAlias: false }` |
| `babelModeV7`         | Enables the new [Babel configuration](./babel.md#v7-mode) mode for Storybook. <br/> `features: { babelModeV7: true }`                                                                                                                |
| `postcss`             | Disables the implicit PostCSS warning. See the [migration documentation](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-implicit-postcss-loader) for context. <br/> `features: { postcss: false }`       |
| `modernInlineRender`  | Enables Storybook's modern inline rendering mode. <br/> `features: { modernInlineRender: false }`                                                                                                                                    |

## Configure story loading

By default, Storybook will load stories from your project based on a glob (pattern matching string) in `.storybook/main.js` that matches all files in your project with extension `.stories.*`. The intention is you colocate a story file with the component it documents.

```
•
└── components
    ├── Button.js
    └── Button.stories.js
```

If you want to use a different naming convention, you can alter the glob using the syntax supported by [picomatch](https://github.com/micromatch/picomatch#globbing-features).

For example, if you wanted to pull both `.md` and `.js` files from the `my-project/src/components` directory, you could write:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-js-md-files.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### With a configuration object

Additionally, you can customize your Storybook configuration to load your stories based on a configuration object. For example, if you wanted to load your stories from a `packages` directory, you could adjust your `stories` configuration field into the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-storyloading-with-custom-object.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

When Storybook starts, it will look for any file containing the `stories` extension inside the `packages/stories` directory and generate the titles for your stories.

### With a directory

You can also simplify your Storybook configuration and load the stories based on a directory. For example, if you want to load all the stories inside a `packages/MyStories`, you can adjust the configuration as such:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-storyloading-with-directory.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### With a custom implementation

You can also adjust your Storybook configuration and implement your custom logic for loading your stories. For example, suppose you were working on a project that includes a particular pattern that the conventional ways of loading stories could not solve, in that case, you could adjust your configuration as follows:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-storyloading-custom-logic.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### On-demand story loading

As your Storybook grows in size, it gets challenging to load all of your stories in a performant way, slowing down the loading times and yielding a large bundle. Starting with Storybook 6.4, you can optimize your story loading by enabling the `storyStoreV7` feature flag in your configuration as follows:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-on-demand-story-loading.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Once you've restarted your Storybook, you'll see an almost immediate performance gain in your loading times and also a decrease in the generated bundle.

#### Known limitations

This feature is experimental, and it has some limitations on what you can and cannot do in your stories files. If you plan to use it, you'll need to take into consideration the following limitations:

- [CSF formats](../api/csf.md) from version 1 to version 3 are supported. The `storiesOf` construct is not.
- Custom`storySort` functions are allowed based on a restricted API.

## Configure your project with TypeScript

If you need, you can also configure your Storybook using TypeScript. To get started, add a `.babelrc` file inside your project and include the following Babel presets:

Rename your `.storybook/main.js` to `.storybook/main.ts` and restart your Storybook.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-ts-config-babelrc.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Using Storybook API

You can also use Storybook's API to configure your project with TypeScript. Under the hood, it mirrors the exact configuration you get by default. Below is an abridged Storybook configuration with TypeScript and additional information about each configuration element.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-default-setup.ts.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

| Configuration element | Description                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories`             | The array of globs that indicates the [location of your story files](#configure-story-loading), relative to `main.ts`                                                            |
| `staticDirs`          | Sets a list of directories of [static files](./images-and-assets.md#serving-static-files-via-storybook-configuration) to be loaded by Storybook <br/> `staticDirs:['../public']` |
| `addons`              | Sets the list of [addons](/addons) loaded by Storybook <br/> `addons:['@storybook/addon-essentials']`                                                                            |
| `typescript`          | Configures how Storybook handles [TypeScript files](./typescript.md) <br/> `typescript: { check: false, checkOptions: {} }`                                                      |
| `framework`           | Configures Storybook based on a set of framework-specific settings <br/> `framework:'@storybook/svelte'`                                                                         |
| `core`                | Sets Storybook's Webpack configuration <br/> `core:{ builder: 'webpack5'}`                                                                                                       |
| `features`            | Enables Storybook's additional features <br/>. See table below for a list of available features `features: { storyStoreV7: true }`                                               |
| `refs`                | Configures [Storybook composition](../sharing/storybook-composition.md) <br/> `refs:{ example: { title: 'ExampleStorybook', url:'https://your-url.com' } }`                      |
| `logLevel`            | Configures Storybook's logs in the browser terminal. Useful for debugging <br/> `logLevel: 'debug'`                                                                                      |
| `webpackFinal`        | Customize Storybook's [Webpack](./webpack.md) setup <br/> `webpackFinal: async (config:any) => { return config; }`                                                               |

## Configure story rendering

To control the way stories are rendered and add global [decorators](../writing-stories/decorators.md#global-decorators) and [parameters](../writing-stories/parameters.md#global-parameters), create a `.storybook/preview.js` file. This is loaded in the Canvas tab, the “preview” iframe that renders your components in isolation. Use `preview.js` for global code (such as [CSS imports](../get-started/setup.md#render-component-styles) or JavaScript mocks) that applies to all stories.

The `preview.js` file can be an ES module and export the following keys:

- `decorators` - an array of global [decorators](../writing-stories/decorators.md#global-decorators)
- `parameters` - an object of global [parameters](../writing-stories/parameters.md#global-parameters)
- `globalTypes` - definition of [globalTypes](../essentials/toolbars-and-globals.md#global-types-and-the-toolbar-annotation)

If you’re looking to change how to order your stories, read about [sorting stories](../writing-stories/naming-components-and-hierarchy.md#sorting-stories).

## Configure Storybook’s UI

To control the behavior of Storybook’s UI (the **“manager”**), you can create a `.storybook/manager.js` file.

This file does not have a specific API but is the place to set [UI options](./features-and-behavior.md) and to configure Storybook’s [theme](./theming.md).
