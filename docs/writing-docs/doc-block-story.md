---
title: 'Story'
---

Stories (component tests) are Storybook's fundamental building blocks.
In Storybook Docs, stories are rendered in the `Story` block.

![Docs blocks with stories](./docblock-story.png)

## Working with the DocsPage

With each story you write, Storybook will automatically generate a new `Story` Doc Block, wrapped inside a [`Canvas`](./doc-block-canvas.md)(with a toolbar if it's the first "primary" story) alongside a [source code ](./doc-block-source.md) preview underneath it. Below is a condensed table of the available configuration options.

| Option          | Description                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inlineStories` | Configures Storybook to render stories inline. <br/> `docs: { inlineStories: false }` <br/> Read the [documentation](./docs-page.md#inline-stories-vs-iframe-stories) for inline rendering framework support. |

## Working with MDX

With MDX, the `Story` block is not only a way of rendering stories, but how you define them. Internally, Storybook looks for named `Story` instances located at the top of your document, or inside a [Canvas](./doc-block-canvas.md). Below is an abridged example and table featuring all the available options.

| Option       | Description                                                                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args`       | Provide the required component inputs (e.g., props). <br/> `<Story args={{ text: 'Button' }}/>` <br/> Read the [documentation](../writing-stories/args.md) to learn more.                                                                                     |
| `decorators` | Provide additional markup or mock a data provider to allow proper story rendering. <br/> `<Story decorators={[(Story) => ( div style={{ margin: '3em' }}><Story/></div>)]}/>` <br/> Read the [documentation](../writing-stories/decorators.md) to learn more. |
| `id`         | Storybook's internal story identifier. Used for embedding Storybook stories inside Docs. <br/> `<Story id="example-mycomponent--starter"/>` <br/> Read the [documentation](../api/mdx.md#embedding-stories) to learn more.                                    |
| `inline`     | Enables Storybook's inline renderer. <br/> `<Story inline={false}/>` <br/> Read the [documentation](./docs-page.md#inline-stories-vs-iframe-stories) to learn more.                                                                                           |
| `loaders`    | (Experimental) Asynchronous function for data fetching with stories. <br/> `<Story loaders={[async () => ({ data: await (await fetch('your-endpoint'))}) ]}/>` <br/> Read the [documentation](../writing-stories/loaders.md) to learn more.                   |
| `name`       | Adds a name to the component story. <br/> `<Story name="Example"/>` .                                                                                                                                                                                         |
| `parameters` | Provides the necessary static named metadata related to the story. <br/> `Story parameters={{ backgrounds: { values: [{ name:'red', value:'#f00' }] } }} />` <br/> Read the [documentation](../writing-stories/parameters.md) to learn more.                  |
| `play`       | Generate component interactions. <br/> `<Story play={async () => { await userEvent.click(screen.getByRole('button')) }}/>` <br/> Read the [documentation](../writing-stories/play.md) to learn more.                                                          |

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/component-story-mdx-story-by-name.mdx.mdx',
    'angular/component-story-mdx-story-by-name.mdx.mdx',
    'vue/component-story-mdx-story-by-name.mdx-2.mdx.mdx',
    'vue/component-story-mdx-story-by-name.mdx-3.mdx.mdx',
    'svelte/component-story-mdx-story-by-name.mdx.mdx',
    'common/component-story-mdx-reference-storyid.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Inline rendering

All stories are rendered in the Preview iframe for isolated development in Storybook's Canvas. With Docs, if your framework supports [inline rendering](./docs-page.md#inline-stories-vs-iframe-stories), it will be used by default for both performance and convenience. However, you can force this feature by providing the required configuration option (see tables above).