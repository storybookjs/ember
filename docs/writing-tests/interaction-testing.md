---
title: 'Interaction tests'
---

As you build more complex UIs like pages, components become responsible for more than just rendering the UI. They fetch data and manage state. Interaction tests allow you to verify these functional aspects of UI.

In a nutshell, you start by supplying the appropriate props for the initial state of a component. Then simulate user behavior such as clicks and form entries. Finally, test expectations to check whether the UI and component state update correctly.

![Storybook interaction testing](./storybook-interaction-tests.gif)

## Setup interactions addon

You can set up interaction testing in Storybook using the `play` function and [`@storybook/addon-interactions`](https://storybook.js.org/addons/@storybook/addon-interactions/).

- [`play`](../writing-stories/play-function.md) function is a convenient helper method to help test use cases that would otherwise require manual interaction from a user. They are small snippets of code that run after the story finishes rendering.

- [`@storybook/addon-interactions`](/addons/@storybook/addon-interactions/) includes helper utilities and a playback interface that simulates user behavior in the browser. It’s powered Testing Library and includes convenient instrumentation for debugging.

Here's an example of how to set up interaction testing in Storybook with the `play` function:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/login-form-with-play-function.js.mdx',
    'react/login-form-with-play-function.ts.mdx',
    'react/login-form-with-play-function.mdx.mdx',
    'angular/login-form-with-play-function.ts.mdx',
    'angular/login-form-with-play-function.mdx.mdx',
    'vue/login-form-with-play-function.2.js.mdx',
    'vue/login-form-with-play-function.mdx-2.mdx',
    'vue/login-form-with-play-function.3.js.mdx',
    'vue/login-form-with-play-function.mdx-3.mdx',
    'svelte/login-form-with-play-function.js.mdx',
    'svelte/login-form-with-play-function.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Once the story loads in the UI, it simulates the user's behavior and verifies the underlying logic.

<video autoPlay muted playsInline loop>
  <source
    src="addon-interaction-example-optimized.mp4"
    type="video/mp4"
  />
</video>

## API for user-events

Under the hood, Storybook’s interaction addon mirrors Testing Library’s `user-events` API. If you’re familiar with [Testing Library](https://testing-library.com/) you should be at home in Storybook.

Below is an abridged API for user-event. For more, check out the [official user-event docs](https://testing-library.com/docs/ecosystem-user-event/).

| User events       | Description                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clear`           | Selects the text inside inputs, or textareas and deletes it <br/>`userEvent.clear(await within(canvasElement).getByRole('myinput'));`                    |
| `click`           | Clicks the element, calling a click() function <br/>`userEvent.click(await within(canvasElement).getByText('mycheckbox'));`                              |
| `dblClick`        | Clicks the element twice <br/>`userEvent.dblClick(await within(canvasElement).getByText('mycheckbox'));`                                                 |
| `deselectOptions` | Removes the selection from a specific option of a select element <br/>`userEvent.deselectOptions(await within(canvasElement).getByRole('listbox','1'));` |
| `hover`           | Hovers an element <br/>`userEvent.hover(await within(canvasElement).getByTestId('example-test'));`                                                       |
| `keyboard`        | Simulates the keyboard events <br/>`userEvent.keyboard(‘foo’);`                                                                                          |
| `selectOptions`   | Selects the specified option, or options of a select element <br/>`userEvent.selectOptions(await within(canvasElement).getByRole('listbox'),['1','2']);` |
| `type`            | Writes text inside inputs, or textareas <br/>`userEvent.type(await within(canvasElement).getByRole('my-input'),'Some text');`                            |
| `unhover`         | Unhovers out of element <br/>`userEvent.unhover(await within(canvasElement).getByLabelText(/Example/i));`                                                |

### Permalinks for reproductions

The `play` function is executed after the story is rendered. If there’s an error, it’ll be shown in the interaction addon panel to help with debugging.

Since Storybook is a webapp, anyone with the URL can reproduce the error with the same detailed information without any additional environment configuration or tooling required.

![Interaction testing with a component](./storybook-addon-interactions-error-optimized.png)

Streamline interaction testing further by automatically [publishing Storybook](../sharing/publish-storybook.md) in pull requests. That gives teams a universal reference point to test and debug stories.

---

#### What’s the difference between interaction tests and visual tests?

Interaction tests can be expensive to maintain when applied wholesale to every component. We recommend combining them with other methods like visual testing for comprehensive coverage with less maintenance work.

#### Learn about other UI tests

- [Visual tests](./visual-testing.md) for appearance
- [Accessibility tests](accessibility-testing.md) for accessibility
- Interaction tests for user behavior simulation
- [Snapshot tests](./snapshot-testing.md) for rendering errors and warnings
- [Import stories in other tests](./importing-stories-in-tests.md) for other tools
