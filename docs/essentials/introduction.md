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

If you ran `sb init` to include Storybook in your project, the Essentials addon (`@storybook/addon-essentials`) is already installed and configured for you. You can skip the rest of this section.

If you're upgrading from a previous Storybook version, you'll need to run the following command in your terminal:

```shell
#With npm
npm install -D @storybook/addon-essentials

#With yarn
yarn add -D @storybook/addon-essentials
```

Update your Storybook configuration (in `.storybook/main.js`) to include the Essentials addon.

```js
// .storybook/main.js

module.exports = {
  addons: ['@storybook/addon-essentials'],
};
```

### Configuration

Essentials is "zero-config”. It comes with a recommended configuration out of the box.

If you need to reconfigure any of the individual essential addons, install them manually by following its installation instructions and adjusting its configuration to suit your needs.

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
