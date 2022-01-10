---
title: 'Component Story Format (CSF)'
---

Component Story Format (CSF) is the recommended way to [write stories](../writing-stories/introduction.md). It's an [open standard](https://github.com/ComponentDriven/csf) based on ES6 modules that is portable beyond Storybook.

<div class="aside">

💡 If you are writing stories in the older `storiesOf()` syntax, you can find documentation in an [advanced README](../../lib/core/docs/storiesOf.md).

</div>

In CSF, stories and component metadata are defined as ES Modules. Every component story file consists of a required [default export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#Using_the_default_export) and one or more [named exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export).

CSF is supported in all frameworks except React Native, where you should use the [storiesOf API](../../lib/core/docs/storiesOf.md) instead.

## Default export

The default export defines metadata about your component, including the `component` itself, its `title` (where it will show up in the [navigation UI story hierarchy](../writing-stories/naming-components-and-hierarchy.md#sorting-stories)), [decorators](../writing-stories/decorators.md), and [parameters](../writing-stories/parameters.md).

The `component` field is required and used by addons for automatic prop table generation and display of other component metadata. The `title` field is optional and should be unique (i.e., not re-used across files).

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/my-component-story-mandatory-export.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

For more examples, see [writing stories](../writing-stories/introduction.md).

## Named story exports

With CSF, every named export in the file represents a story object by default.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/my-component-story-basic-and-props.js.mdx',
    'react/my-component-story-basic-and-props.ts.mdx',
    'vue/my-component-story-basic-and-props.js.mdx',
    'svelte/my-component-story-basic-and-props.js.mdx',
    'svelte/my-component-story-basic-and-props.native-format.mdx',
    'angular/my-component-story-basic-and-props.ts.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The exported identifiers will be converted to "start case" using Lodash's [startCase](https://lodash.com/docs/#startCase) function. For example:

| Identifier       |  Transformation   |
| ---------------- | :---------------: |
| name             |       Name        |
| someName         |     Some Name     |
| someNAME         |     Some NAME     |
| some_custom_NAME | Some Custom NAME  |
| someName1234     | Some Name 1 2 3 4 |

We recommend that all export names to start with a capital letter.

Story objects can be annotated with a few different fields to define story-level [decorators](../writing-stories/decorators.md) and [parameters](../writing-stories/parameters.md), and also to define the `name` of the story.

Storybook's `name` configuration element is helpful in specific circumstances. Common use cases are names with special characters or Javascript restricted words. If not specified, Storybook defaults to the named export.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/my-component-story-with-storyname.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## Args story inputs

Starting in SB 6.0, stories accept named inputs called Args. Args are dynamic data that are provided (and possibly updated by) Storybook and its addons.

Consider Storybook’s ["Button" example](../writing-stories/introduction.md#defining-stories) of a text button that logs its click events:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-click-handler.js.mdx',
    'react/button-story-click-handler.ts.mdx',
    'vue/button-story-click-handler.2.js.mdx',
    'vue/button-story-click-handler.3.js.mdx',
    'svelte/button-story-click-handler.js.mdx',
    'svelte/button-story-click-handler.native-format.mdx',
    'angular/button-story-click-handler.ts.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Now consider the same example, re-written with args:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-click-handler-args.js.mdx',
    'vue/button-story-click-handler-args.2.js.mdx',
    'vue/button-story-click-handler-args.3.js.mdx',
    'angular/button-story-click-handler-args.ts.mdx',
    'svelte/button-story-click-handler-args.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->


Or even more simply:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-click-handler-simplificated.js.mdx',
    'angular/button-story-click-handler-simplificated.ts.mdx',
    'vue/button-story-click-handler-simplificated.js.mdx',
    'svelte/button-story-click-handler-simplificated.native-format.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Not only are these versions shorter and more accessible to write than their no-args counterparts, but they are also more portable since the code doesn't depend on the actions addon specifically.

For more information on setting up [Docs](../writing-docs/introduction.md) and [Actions](../essentials/actions.md), see their respective documentation.

## Play function

Storybook's `play` functions are small snippets of code executed when the story renders in the UI. They are convenient helper methods to help you test use cases that otherwise weren't possible or required user intervention.

A good use case for the `play` function is a form component. With previous Storybook versions, you'd write your set of stories and had to interact with the component to validate it. With Storybook's play functions, you could write the following story:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/login-form-with-play-function.js.mdx',
    'react/login-form-with-play-function.ts.mdx',
    'angular/login-form-with-play-function.ts.mdx',
    'vue/login-form-with-play-function.2.js.mdx',
    'vue/login-form-with-play-function.3.js.mdx',
    'svelte/login-form-with-play-function.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

When the story renders in the UI, Storybook executes each step defined in the `play` function and runs the assertions without the need for user interaction.

## Storybook export vs. name handling

Storybook handles named exports and the `name` option slightly differently. When should you use one vs. the other?

Storybook will always use the named export to determine the story ID and URL.

If you specify the `name` option, it will be used as the story display name in the UI. Otherwise, it defaults to the named export, processed through Storybook's `storyNameFromExport` and `lodash.startCase` functions.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-test-with-storyname.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

When you want to change the name of your story, rename the CSF export. It will change the name of the story and also change the story's ID and URL.

It would be best if you used the `name` configuration element in the following cases:

1. You want the name to show up in the Storybook UI in a way that's not possible with a named export, e.g., reserved keywords like "default", special characters like emoji, spacing/capitalization other than what's provided by `storyNameFromExport`.
2. You want to preserve the Story ID independently from changing how it's displayed. Having stable Story IDs is helpful for integration with third-party tools.

## Non-story exports

In some cases, you may want to export a mixture of stories and non-stories (e.g., mocked data).

You can use the optional configuration fields `includeStories` and `excludeStories` in the default export to make this possible. You can define them as an array of strings or regular expressions.

Consider the following story file:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/my-component-story-with-nonstory.js.mdx',
    'react/my-component-story-with-nonstory.ts.mdx',
    'vue/my-component-story-with-nonstory.2.js.mdx',
    'vue/my-component-story-with-nonstory.3.js.mdx',
    'svelte/my-component-story-with-nonstory.js.mdx',
    'angular/my-component-story-with-nonstory.ts.mdx'
  ]}
/>

<!-- prettier-ignore-end -->

When this file renders in Storybook, it treats `ComplexStory` and `SimpleStory` as stories and ignores the `data` named exports.

For this particular example, you could achieve the same result in different ways, depending on what's convenient:

- `includeStories: /^[A-Z]/`
- `includeStories: /.*Story$/`
- `includeStories: ['SimpleStory', 'ComplexStory']`
- `excludeStories: /^[a-z]/`
- `excludeStories: /.*Data$/`
- `excludeStories: ['simpleData', 'complexData']`

The first option is the recommended solution if you follow the best practice of starting story exports with an uppercase letter (i.e., use UpperCamelCase).