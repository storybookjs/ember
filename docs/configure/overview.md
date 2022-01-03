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

<div class="aside">
 💡 Tip: Customize your default story by referencing it first in the `stories` array.
</div>

## Configure story loading

By default, Storybook will load stories from your project based on a glob (pattern matching string) in `.storybook/main.js` that matches all files in your project with extension `.stories.*`. The intention is you colocate a story file with the component it documents.

```
•
└── components
    ├── Button.js
    └── Button.stories.js
```

If you want to use a different naming convention, you can alter the glob, using the syntax supported by [picomatch](https://github.com/micromatch/picomatch#globbing-features).

For example, if you wanted to pull both `.md` and `.js` files from the `my-project/src/components` directory, you could write:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-js-md-files.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### With a configuration object

Additionally, you can also customize your Storybook configuration to load your stories based on a configuration object. For example, if you wanted to load your stories from a `packages` directory, you could adjust your `stories` configuration field into the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-storyloading-with-custom-object.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

<div class="aside">
💡 If you've enabled <a href="#on-demand-story-loading">on-demand story loading</a>, this option will not work. You must define the story's titles manually.
</div>

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

You can also adjust your Storybook configuration and implement your own custom logic for loading your stories. For example, suppose you were working on a project that includes a particular pattern that the conventional ways of loading stories could not solve, in that case, you could adjust your configuration as follows:

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
- You must manually set the story's titles and names (e.g., `title: 'MyComponent`).
- Custom`storySort` functions are allowed based on a restricted API.

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