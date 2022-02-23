---
title: 'Canvas'
---

Storybook's `Canvas` Doc Block is a wrapper featuring a toolbar that allows you to interact with its content while automatically providing the required [Source](./doc-block-source.md) snippets.

![Docs block with a story preview](./docblock-preview.png)

## Working with the DocsPage

Storybook's [DocsPage](./docs-page.md) wraps each story inside a `Canvas` Doc Block. The first story rendered in the DocsPage is automatically configured with a toolbar and set as _primary_. All other existing stories will not feature the toolbar. It also includes a [Source](./doc-block-source.md) Doc Block to visualize the story code snippet.

## Working with MDX

The `Canvas` Doc Block includes additional customization options if you're writing MDX stories. Below is a condensed example and table featuring all the available options.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/mdx-canvas-doc-block.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

| Option        | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `columns`     | Splits the stories based on the number of defined columns. <br/> `<Canvas columns={2}></Canvas>` |
| `isColumn`    | Displays the stories one above the other. <br/> `<Canvas isColumn></Canvas>`                     |
| `withSource`  | Controls the source code block visibility. <br/> `Canvas withSource="open"></Canvas>`            |
| `withToolbar` | Sets the `Canvas` toolbar visibility. <br/> `<Canvas withToolbar></Canvas>`                      |

### Rendering multiple stories

If you want, you can also group multiple stories and render them inside a single `Canvas` Doc Block. For example:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/mdx-canvas-multiple-stories.mdx.mdx',
    'angular/mdx-canvas-multiple-stories.mdx.mdx',
    'vue/mdx-canvas-multiple-stories.mdx-2.mdx.mdx',
    'vue/mdx-canvas-multiple-stories.mdx-3.mdx.mdx',
    'svelte/mdx-canvas-multiple-stories.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Non-story content

Additionally, you can also place non-story related content inside `Canvas` Doc Block allowing you to render the JSX content precisely as it would if you placed it inside an MDX file, for example:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/my-component-with-story-content.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

When rendered, Storybook will automatically generate the code snippet for this inside the [Source](./doc-block-source.md) block beneath the block.