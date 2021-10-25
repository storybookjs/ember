---
title: 'Decorators'
---

A decorator is a way to wrap a story in extra “rendering” functionality. Many addons define decorators to augment your stories with extra rendering or gather details about how your story is rendered.

When writing stories, decorators are typically used to wrap stories with extra markup or context mocking.

## Wrap stories with extra markup

Some components require a “harness” to render in a useful way. For instance, if a component runs right up to its edges, you might want to space it inside Storybook. Use a decorator to add spacing for all stories of the component.

![Story without padding](./decorators-no-padding.png)

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/your-component-with-decorator.js.mdx',
    'react/your-component-with-decorator.story-function-js.js.mdx',
    'react/your-component-with-decorator.ts.mdx',
    'react/your-component-with-decorator.story-function-ts.ts.mdx',
    'react/your-component-with-decorator.mdx.mdx',
    'vue/your-component-with-decorator.js.mdx',
    'vue/your-component-with-decorator.mdx.mdx',
    'angular/your-component-with-decorator.ts.mdx',
    'angular/your-component-with-decorator.mdx.mdx',
    'svelte/your-component-with-decorator.js.mdx',
    'svelte/your-component-with-decorator.native-format.mdx',
    'svelte/your-component-with-decorator.mdx.mdx',
    'web-components/your-component-with-decorator.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

![Story with padding](./decorators-padding.png)

## “Context” for mocking

Some libraries require components higher up in the component hierarchy to render correctly. For example, in Styled Components, a `ThemeProvider` is necessary if your components use themes. Add a single global decorator that adds this context to all stories in [`.storybook/preview.js`](../configure/overview.md#configure-story-rendering):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/storybook-preview-with-styled-components-decorator.js.mdx',
    'react/storybook-preview-with-styled-components-decorator.story-function.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

In the example above, the theme is hardcoded to a mock value of `default`. Still, you may want to vary that value, either on a per-story basis (if it is data you are mocking that is relevant to the other args of the story) or in a user-controlled way (for instance, to provide a theme switcher).

The second argument to a decorator function is the **story context** which in particular contains the keys:

- `args` - the story arguments. You can use some [`args`](./args.md) in your decorators and drop them in the story implementation itself.
- `argTypes`- Storybook's [argTypes](../api/argtypes.md) allow you to customize and fine-tune your stories [`args`](./args.md).
- `globals` -  Storybook-wide [globals](../essentials/toolbars-and-globals.md#globals). In particular you can use the [toolbars feature](../essentials/toolbars-and-globals.md#global-types-toolbar-annotations) to allow you to change these values using Storybook’s UI.
- `hooks` - Storybook's API hooks (e.g., useArgs).
- `parameters`- the story's static metadata, most commonly used to control Storybook's behavior of features and addons.
- `viewMode`- Storybook's current active window (e.g., canvas, docs).

<div class="aside">
💡 <strong>Note:</strong> This pattern can also be applied to your own stories. Some of Storybook's supported frameworks already use it (e.g., vue 2).
</div>

### Using decorators to provide data

If your components are “connected” and require side-loaded data to render, you can use decorators to provide that data in a mocked way without having to refactor your components to take that data as an arg. There are several techniques to achieve this. Depending on exactly how you are loading that data -- read more in the [building pages in Storybook](../workflows/build-pages-with-storybook.md) section.

## Story decorators

To define a decorator for a single story, use the `decorators` key on a named export:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-decorator.js.mdx',
    'react/button-story-decorator.story-function.js.mdx',
    'react/button-story-decorator.mdx.mdx',
    'vue/button-story-decorator.js.mdx',
    'vue/button-story-decorator.mdx.mdx',
    'angular/button-story-decorator.ts.mdx',
    'angular/button-story-decorator.mdx.mdx',
    'svelte/button-story-decorator.js.mdx',
    'svelte/button-story-decorator.mdx.mdx',
    'web-components/button-story-decorator.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

It is useful to ensure that the story remains a “pure” rendering of the component under test, and any extra HTML or components you need to add don’t pollute that. In particular the [Source](../writing-docs/doc-blocks.md#source) docblock works best when you do this.

## Component decorators

To define a decorator for all stories of a component, use the `decorators` key of the default CSF export:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-component-decorator.js.mdx',
    'react/button-story-component-decorator.ts.mdx',
    'react/button-story-component-decorator.mdx.mdx',
    'vue/button-story-component-decorator.js.mdx',
    'vue/button-story-component-decorator.mdx.mdx',
    'angular/button-story-component-decorator.ts.mdx',
    'angular/button-story-component-decorator.mdx.mdx',
    'svelte/button-story-component-decorator.js.mdx',
    'svelte/button-story-component-decorator.native-format.mdx',
    'svelte/button-story-component-decorator.mdx.mdx',
    'web-components/button-story-component-decorator.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## Global decorators

We can also set a decorator for **all stories** via the `decorators` export of your [`.storybook/preview.js`](../configure/overview.md#configure-story-rendering) file (this is the file where you configure all stories):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/storybook-preview-global-decorator.js.mdx',
    'react/storybook-preview-global-decorator.story-function.js.mdx',
    'vue/storybook-preview-global-decorator.js.mdx',
    'angular/storybook-preview-global-decorator.ts.mdx',
    'svelte/storybook-preview-global-decorator.js.mdx',
    'web-components/storybook-preview-global-decorator.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## Decorator inheritance

Like parameters, decorators can be defined globally, at the component level, and for a single story (as we’ve seen).

All decorators, defined at all levels that apply to a story, will run whenever that story is rendered, in the order:

- Global decorators, in the order they are defined
- Component decorators, in the order they are defined
- Story decorators, in the order they are defined.