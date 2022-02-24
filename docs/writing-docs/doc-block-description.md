---
title: 'Description'
---

Storybook's `Description` Doc Block displays the component's description obtained from its source code or user-generated content.

![Docs blocks with description](./docblock-description.png)

## Working with the DocsPage

Storybook extracts the component's description and renders it at the top of the page. It is automatically generated from the docgen component for the [supported frameworks](../api/frameworks-feature-support.md) based on the component's source code. Below is an abridged example and available options.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/component-story-csf-description.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

| Option      | Description                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `component` | Overrides the default component description. <br/> `description: { component:'An example component description' }`                                                |
| `markdown`  | Provides custom Markdown for the component description. <br/> `<Description markdown={dedent'# Custom Description'} />` <br/> Only applicable to MDX.             |
| `story`     | Overrides the story description. <br/> `description: { story: 'An example story description' }`                                                                   |
| `of`        | Sets the description based either on a component or story. <br/> `<Description of={Commponent} />` <br/> `<Description of={'.'} />` <br/> Only applicable to MDX. |

## Working with MDX

If you need, you can also include the `Description` Doc Block in your MDX stories. It relies on the same heuristics as the one applied in the DocsPage. For example:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/component-story-mdx-description.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->