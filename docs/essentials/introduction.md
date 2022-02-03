---
title: 'Essential addons'
---

A major strength of Storybook are [addons](/addons/) that extend Storybook’s UI and behavior. Storybook ships by default with a set of “essential” addons that add to the initial user experience. There are many third-party addons as well as “official” addons developed by the Storybook core team.

- [Docs](../writing-docs/introduction.md)
- [Controls](./controls.md)
- [Actions](./actions.md)
- [Viewport](./viewport.md)
- [Backgrounds](./backgrounds.md)
- [Toolbars & globals](./toolbars-and-globals.md)
- [Measure & outline](./measure-and-outline.md)

### Installation

If you ran `sb init` to include Storybook in your project, the Essentials addon ([`@storybook/addon-essentials`](https://storybook.js.org/addons/tag/essentials)) is already installed and configured for you. You can skip the rest of this section.

If you're upgrading from a previous Storybook version, you'll need to run the following command in your terminal:

```shell
#With npm
npm install -D @storybook/addon-essentials

#With yarn
yarn add -D @storybook/addon-essentials
```

Update your Storybook configuration (in [`.storybook/main.js`](../configure/overview.md#configure-story-rendering)) to include the Essentials addon.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-register-individual-actions-addon.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Configuration

Essentials is "zero-config”. It comes with a recommended configuration out of the box.

If you need to reconfigure any of the [individual Essentials addons](https://storybook.js.org/addons/tag/essentials), install them manually by following the installation instructions, register them in your Storybook configuration file (i.e., [`.storybook/main.js`](../configure/overview.md#configure-story-rendering)) and adjust the configuration to suit your needs. For example:

```shell
#With npm
npm install -D @storybook/addon-actions


#With yarn
yarn add -D @storybook/addon-actions
```

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-register-individual-actions-addon.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Below is an abridged configuration and table with all the available options for each addon.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-full-individual-essentials-config.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

| Addon                          | Configuration element | Description                                                                                                                                                                                                             |
| ------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@storybook/addon-actions`     | N/A                   | N/A                                                                                                                                                                                                                     |
| `@storybook/addon-viewport`    | N/A                   | N/A                                                                                                                                                                                                                     |
| `@storybook/addon-docs`        | `configureJSX`        | Enables JSX support in MDX for projects that aren't configured to handle the format. <br/> `configureJSX: true`                                                                                                         |
|                                | `babelOptions`        | Provides additional Babel configurations for file transpilation. <br/> `babelOptions: { plugins: [], presets: []}` <br/> Extends `configureJSX`.                                                                        |
|                                | `sourceLoaderOptions` | Provides additional configuration for Storybook's source loader. <br/> `sourceLoaderOptions: null` . <br/> Required for [`@storybook/addon-storysource`](https://storybook.js.org/addons/@storybook/addon-storysource). |
|                                | `transcludeMarkdown`  | Enables Markdown file support into MDX and render them as components. <br/> `transcludeMarkdown: true`                                                                                                                  |
| `@storybook/addon-controls`    | N/A                   | N/A                                                                                                                                                                                                                     |
| `@storybook/addon-backgrounds` | N/A                   | N/A                                                                                                                                                                                                                     |
| `@storybook/addon-toolbars`    | N/A                   | N/A                                                                                                                                                                                                                     |
| `@storybook/addon-measure`     | N/A                   | N/A                                                                                                                                                                                                                     |

When you start Storybook, your custom configuration will override the default.

### Disabling addons

If you need to disable any of the Essential's addons, you can do it by changing your [`.storybook/main.js`](../configure/overview.md#configure-story-rendering) file.

For example, if you wanted to disable the [backgrounds addon](./backgrounds.md), you would apply the following change to your Storybook configuration:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-main-disable-addon.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

<div class="aside">

💡 You can use the following keys for each individual addon: `actions`, `backgrounds`, `controls`, `docs`, `viewport`, `toolbars`, `measure`, `outline`.

</div>