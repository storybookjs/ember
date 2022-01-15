---
title: 'ArgTypes'
---

<div class="aside">

This API is experimental and may change outside of the typical semver release cycle

</div>

ArgTypes are a first-class feature in Storybook for specifying the behaviour of [Args](../writing-stories/args.md). By specifying the type of an arg, you constrain the values that it can take and provide information about args that are not explicitly set (i.e., not required).

You can also use argTypes to “annotate” args with information used by addons that make use of those args. For instance, to instruct the controls addon to render a color, you could choose a string-valued arg.

The most concrete realization of argTypes is the [Args Table](../writing-docs/doc-blocks.md#argstable) doc block. Each row in the table corresponds to a single argType and the current value of that arg.

![Storybook inferring automatically the argType](./argstable.png)

## Automatic argType inference

If you are using the Storybook [docs](../writing-docs/introduction.md) addon (installed by default as part of [essentials](../essentials/introduction.md)), then Storybook will infer a set of argTypes for each story based on the `component` specified in the [default export](./csf.md#default-export) of the CSF file.

To do so, Storybook uses various static analysis tools depending on your framework.

- React
  - [react-docgen](https://github.com/reactjs/react-docgen)
  - [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript)
- Vue
  - [vue-docgen-api](https://github.com/vue-styleguidist/vue-styleguidist/tree/dev/packages/vue-docgen-api)
- Angular
  - [compodoc](https://compodoc.app/)
- WebComponents
  - [custom-element.json](https://github.com/webcomponents/custom-elements-json)
- Ember
  - [YUI doc](https://github.com/ember-learn/ember-cli-addon-docs-yuidoc#documenting-components)

The format of the generated argType will look something like this:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-generated-argtypes.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

This ArgTypes data structure, name, type, defaultValue, and description are standard fields in all ArgTypes (analogous to PropTypes in React). The table and control fields are addon-specific annotations. So, for example, the table annotation provides extra information to customize how the label gets rendered, and the control annotation includes additional information for the control editing the property.

<div class="aside">

💡 The `@storybook/addon-docs` provide a shorthand for common tasks:

- `type: 'number'` is shorthand for type: { name: 'number' }
- `control: 'radio'` is shorthand for control: { type: 'radio' }

</div>

#### Manual specification

If you want more control over the args table or any other aspect of using argTypes, you can overwrite the generated argTypes for your component on a per-arg basis. For instance, with the above-inferred argTypes and the following default export:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-customize-argtypes.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The `values.description`, `table.type`, and `controls.type` are merged into the defaults extracted by Storybook. The final merged values would be:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-merged-argtypes.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

In particular, this would render a row with a modified description, a type display with a dropdown that shows the detail, and no control.

<div class="aside">
💡 As with other Storybook properties (e.g., args, decorators), you can also override ArgTypes per story basis.
</div>

#### Using argTypes in addons

If you want to access the argTypes of the current component inside an addon, you can use the `useArgTypes` hook from the `@storybook/api` package:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-argtypes-with-addon.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->