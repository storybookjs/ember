---
title: 'Backgrounds'
---

The backgrounds toolbar addon allows you to set the background color in which the story renders in the UI:

<video autoPlay muted playsInline loop>
  <source
    src="addon-backgrounds-optimized.mp4"
    type="video/mp4"
  />
</video>

## Configuration

By default, the backgrounds toolbar includes a light and dark background.

But you're not restricted to these backgrounds, you can configure your own set of colors with the `parameters.backgrounds` [parameter](../writing-stories/parameters.md) in your [`.storybook/preview.js`](../configure/overview.md#configure-story-rendering):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-preview-configure-background-colors.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

If you define the `default` property, the addon will apply it to all stories. Otherwise, it's only listed as an available color.

### Extending the configuration

You can also define backgrounds per-component or per-story basis through [parameter inheritance](../writing-stories/parameters.md#component-parameters):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-backgrounds-configure-backgrounds.js.mdx',
    'common/storybook-addon-backgrounds-configure-backgrounds.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

You can also override a single key on the `backgrounds` parameter, for instance, to set a different default value for a particular story:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-backgrounds-override-background-color.js.mdx',
    'common/storybook-addon-backgrounds-override-background-color.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Disable backgrounds

If you want to disable backgrounds in a story, you can do so by setting the `backgrounds` parameter like so:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-backgrounds-disable-backgrounds.js.mdx',
    'common/storybook-addon-backgrounds-disable-backgrounds.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## Grid

Backgrounds toolbar also includes a Grid selector. This way, you can quickly see if your components are aligned.

You don't need additional configuration to get started. But its properties are fully customizable, if you don't supply any value to any of its properties, they'll default to the following values:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-backgrounds-configure-grid.js.mdx',
    'common/storybook-addon-backgrounds-configure-grid.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Disable the grid

If you need to disable the grid for a specific story, set the `backgrounds` parameter to the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-backgrounds-disable-grid.js.mdx',
    'common/storybook-addon-backgrounds-disable-grid.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->