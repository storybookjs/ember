---
title: 'Loaders (experimental)'
---

Loaders (experimental) are asynchronous functions that load data for a story and its [decorators](./decorators.md). A story's loaders run before the story renders, and the loaded data injected into the story via its render context.

Loaders can be used to load any asset, lazy load components, or fetch data from a remote API. This feature was designed as a performance optimization to handle large story imports. However, [args](./args.md) is the recommended way to manage story data. We're building up an ecosystem of tools and techniques around Args that might not be compatible with loaded data.

They are an advanced feature (i.e., escape hatch), and we only recommend using them if you have a specific need that other means can't fulfill. They are experimental in Storybook 6.1, and the APIs are subject to change outside of the normal semver cycle.

## Fetching API data

Stories are isolated component examples that render internal data defined as part of the story or alongside the story as [args](./args.md).

Loaders are helpful when you need to load story data externally (e.g., from a remote API). Consider the following example that fetches a todo item to display in a todo list:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/loader-story.js.mdx',
    'react/loader-story.mdx.mdx',
    'vue/loader-story.3.js.mdx',
    'vue/loader-story.mdx.mdx',
    'angular/loader-story.ts.mdx',
    'angular/loader-story.mdx.mdx',
    'svelte/loader-story.js.mdx',
    'svelte/loader-story.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The response obtained from the remote API call is combined into a `loaded` field on the story context, which is the second argument to a story function. For example, in React, the story's args were spread first to prioritize them over the static data provided by the loader. With other frameworks (e.g., Angular), you can write your stories as you'd usually do.

## Global loaders

We can also set a loader for **all stories** via the `loaders` export of your [`.storybook/preview.js`](../configure/overview.md#configure-story-rendering) file (this is the file where you configure all stories):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-preview-global-loader.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

In this example, we load a "current user" available as `loaded.currentUser` for all stories.

## Loader inheritance

Like [parameters](./parameters.md), loaders can be defined globally, at the component level, and for a single story (as we’ve seen).

All loaders, defined at all levels that apply to a story, run before the story renders in Storybook's canvas.

- All loaders run in parallel
- All results are the `loaded` field in the story context
- If there are keys that overlap, "later" loaders take precedence (from lowest to highest):
  - Global loaders, in the order they are defined
  - Component loaders, in the order they are defined
  - Story loaders, in the order they are defined

## Known limitations

Loaders have the following known limitations:

- They are not yet compatible with the storyshots addon ([#12703](https://github.com/storybookjs/storybook/issues/12703)).
- They are not yet compatible with inline-rendered stories in Storybook Docs ([#12726](https://github.com/storybookjs/storybook/issues/12726)).

If you're interested in contributing to this feature, read our [contribution guide](../contribute/how-to-contribute.md) and submit a pull request with your work.