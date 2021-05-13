<h1>Storybook Docs for Lit</h1>

- [Installation](#installation)
- [Props tables](#props-tables)
- [Stories not inline](#stories-not-inline)
- [More resources](#more-resources)

## Installation

- Be sure to check the [installation section of the general addon-docs page](../README.md) before proceeding.

WIP

## Props tables

WIP

## Stories not inline

By default stories are rendered inline.
For web components that is usually fine as they are style encapsulated via shadow dom.
However when you have a style tag in you template it might be best to show them in an iframe.

To always use iframes you can set

```js
addParameters({
  docs: {
    inlineStories: false,
  },
});
```

or add it to individual stories.

```js
<Story inline={false} />
```

## More resources

Want to learn more? Here are some more articles on Storybook Docs:

- References: [DocsPage](../docs/docspage.md) / [MDX](../docs/mdx.md) / [FAQ](../docs/faq.md) / [Recipes](../docs/recipes.md) / [Theming](../docs/theming.md) / [Props](../docs/props-tables.md)
- Announcements: [Vision](https://medium.com/storybookjs/storybook-docs-sneak-peak-5be78445094a) / [DocsPage](https://medium.com/storybookjs/storybook-docspage-e185bc3622bf) / [MDX](https://medium.com/storybookjs/rich-docs-with-storybook-mdx-61bc145ae7bc) / [Framework support](https://medium.com/storybookjs/storybook-docs-for-new-frameworks-b1f6090ee0ea)
- Example: [Storybook Design System](https://github.com/storybookjs/design-system)
