---
title: 'Source'
---

Storybook's `Source` Doc Block displays the story's source code. It supports syntax highlighting for most languages (e.g., `javascript`, `jsx`, `json`, `yml`, `md`, `bash`, `css`, `html`) and can be copied with the click of a button.

![Docs blocks with source](./docblock-source.png)

## Working with the DocsPage

Storybook automatically generates a `Source` Doc Block within the [Canvas](./doc-block-canvas.md) to display the story's code snippet.
It includes additional customization via parameters. Below is a condensed example and tables featuring all the available options.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/component-story-custom-source.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

<div class="aside">

💡 The pattern demonstrated here applies only to the story. If you need, you can it this to all the component stories, introducing a [component parameter](../writing-stories/parameters.md#component-parameters).

</div>

| Option     | Description                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `code`     | Customizes the code snippet to be displayed. <br/> `docs: { source: { code: '<h1>Hello world</h1>' } }`. <br/> Requires `language` for proper syntax highlighting. |
| `dark`     | Sets the background to dark mode. <br/> `<Source dark/>` <br/> Applies only to `MDX`.                                                                              |
| `id`       | Supplies a unique story identifier. <br/> `<Source id="example-mycomponent--starter" />` <br/> Applies only to `MDX`.                                              |
| `language` | Sets the language for syntax highlighting. <br/> `docs: { source: { language: 'html'} }`                                                                           |
| `format`   | Formats the code snippet. <br/> `docs: { source: { format:false } }`                                                                                               |
| `type`     | Sets how the story source snippet is auto-generated. See table below for available values.                                                                         |

| Value              | Description                                                                                                                                                   | Support                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **auto** (default) | Use `dynamic` snippets if the story is written using [Args](../writing-stories/args) and the framework supports it.<br/> `docs: { source: { type: 'auto' } }` | All                                          |
| **dynamic**        | Dynamically generated code snippet based on the output of the story function (e.g, JSX code for React). <br/> `docs: { source: { type: 'dynamic' } }`         | [Limited](../api/frameworks-feature-support) |
| **code**           | Use the raw story source as written in the story file. <br/> `docs: { source: { type: 'code' } }`                                                             | All                                          |

## Working with MDX

If you need, you can also include the `Source` Doc Block in your MDX stories. It accepts either a story ID or a code snippet. For example:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/component-story-mdx-dedent.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->