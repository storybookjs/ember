---
title: 'Interactions'
---

The `play` function in Storybook allows you to simulate user interactions to run after a story renders. With the Interactions addon, you have a way to visualize and debug these interactions. 

## Play function for interactions

Stories isolate and capture component states in a structured manner. While developing a component, you can quickly cycle through the stories to verify the look and feel. Each story specifies all the inputs required to reproduce a specific state. You can even mock context and API calls. That allows you to handle most use cases of a component. But what about states that require user interaction?

For example, clicking a button to open/close a dialog box, dragging a list item to reorder it or filling out a form to check for validation errors. To test those behaviours, you have to interact with the components as a user would. Interactive stories enable you to automate these interactions using a play function. These are small snippets of code that script out the exact steps a human would take to interact with the component. It's then executed as soon as the story is rendered.

### Powered by Testing Library and Jest

The interactions are written using a Storybook-instrumented versions of Testing Library and Jest. That gives you a familiar developer-friendly syntax to interact with the DOM and make assertions, but with extra telemetry to help with debugging.

## Installation

Since Interactions is still experimental, it doesn't yet ship with Storybook by default. As such, you'll have to install it. You may also want to add our wrappers for Testing Library and Jest.

```shell
yarn add -D @storybook/addon-interactions @storybook/jest @storybook/testing-library
```

Next, update [`.storybook/main.js`](../configure/overview.md#configure-story-rendering) to the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-interactions-addon-registration.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

<div class="aside">
⚠️ <strong>Note</strong>: Make sure to list `@storybook/addon-interactions` **after** `addon-essentials` (or `addon-actions`).
</div>

Now when you run Storybook the Interactions addon will be enabled.

![Storybook Interactions installed and registered](./storybook-interactions-installed-registered.png)

## Writing interactions

Interactions run as part of the `play` function on your stories. We rely on Testing Library to do the heavy lifting.

Make sure to import the Storybook wrappers for Jest and Testing Library rather than importing Jest and Testing Library directly.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-interactions-play-function.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The above example uses the `canvasElement` to scope your element queries to the current story. This is important if you want your play functions to eventually be compatible with Storybook Docs, which renders multiple components on the same page.

While you can refer to the [Testing Library documentation](https://testing-library.com/docs/) for details on how to use it, there's an important detail that's different when using the Storybook wrapper: **method invocations must be `await`-ed**. This allows you to step back and forth through your interactions using the debugger.

Any `args` that have been marked as an Action, either using the [argTypes annotation](./actions.md#action-argtype-annotation) or the [argTypesRegex](./actions.md#automatically-matching-args), will be automatically converted to a [Jest mock function](https://jestjs.io/docs/mock-function-api) (spy). This allows you to make assertions about calls to these functions.
