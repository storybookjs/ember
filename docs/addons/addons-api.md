---
title: 'Addon API'
---

## Core Addon API

This is the core addon API. This is how to get the addon API:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-imports.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### addons.getChannel()

Get an instance to the channel to communicate with the manager and the preview. You can find this in both the addon register code and your addon’s wrapper component (where used inside a story).

It has a NodeJS [EventEmitter](https://nodejs.org/api/events.html) compatible API. So, you can use it to emit events and listen for events.

### addons.register()

This method allows you to register an addon and get the storybook API. You can do this only in the Manager App.
See how we can use this:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-register.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Now you'll get an instance to our StorybookAPI. See the [api docs](#storybook-api) for Storybook API regarding using that.

### addons.add()

This method allows you to add a panel to Storybook. (Storybook's Action Logger is a panel). You can do this only in the Manager App.
See how you can use this method:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addon-panel-initial.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The render function is called with `active` and `key`. The `active` value will be true when the panel is focused on the UI.

As you can see, you can set any React Component as the panel. Currently, it's one line of text. But you can do anything you want.
It's a good practice to specify the panel title with the `title` key. You can use any plain text with it.

## makeDecorator API

Use the `makeDecorator` API to create decorators in the style of the official addons. Like so:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-makedecorator.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The options to `makeDecorator` are:

- `name`: The name of the export (e.g. `withFoo`)
- `parameterName`: The name of the parameter your addon uses. This should be unique.
- `skipIfNoParametersOrOptions`: Don't run your decorator if the user hasn't set options (via `.addDecorator(withFoo(options)))`) or parameters (`.add('story', () => <Story/>, { foo: 'param' })`, or `.addParameters({ foo: 'param' })`).
- `allowDeprecatedUsage`: support the deprecated "wrapper" usage (`.add('story', () => withFoo(options)(() => <Story/>))`).
- `wrapper`: your decorator function. Takes the `storyFn`, `context`, and both the `options` and `parameters` (as defined in `skipIfNoParametersOrOptions` above).

<div class="aside">

💡 If the story's parameters include `{ foo: { disable: true } }` (where `foo` is the `parameterName` of your addon), your decorator will not be called.

</div>

---

## Storybook hooks

Writing addons can be simplified a lot by using these Storybook hooks:

### useStorybookState

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-usestorybookstate.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

It allows full access to the entire storybook state.
Your component will re-render whenever the storybook state changes.

If you use this, remember your component will be re-rendered a lot, and you may need to optimize for that using [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo) or [`useMemo`](https://reactjs.org/docs/hooks-reference.html#usememo) or [`PureComponent`](https://reactjs.org/docs/react-api.html#reactpurecomponent).

### useStorybookApi

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-useapi.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

It allows full access to the storybook API.

Details on the Storybook API are further down.

### useChannel

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-usechannel.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Allows both setting subscriptions to events and getting the emitter for emitting custom events to the channel.

The messages can be listened to on both the iframe and the manager side.

### useAddonState

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-useaddonstate.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Extremely useful for addons that need to persist in some form of state.

Storybook may unmount your addon component, so keeping local state might not work well.

Also, some addons consist of multiple parts, some parts in a panel, some in the toolbar, etc.

With this hook, addons can access the same portion of the state, persisted even if the components are unmounted.

### useParameter

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-useparameter.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

This hook gets you the current story's parameter.

If the parameter isn't set, the default value (second argument) is returned instead.

### useGlobals

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-useglobal.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Extremely useful hook for addons that rely on Storybook [Globals](../essentials/toolbars-and-globals.md).

It allows you to retrieve and update any Storybook Globals you want.

If you use this hook, remember that your component will render a lot, and you may need to optimize for that using [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo) or [`useMemo`](https://reactjs.org/docs/hooks-reference.html#usememo) or [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback).

### useArgs

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/args-usage-with-addons.js.mdx'
  ]}
/>

<!-- prettier-ignore-end -->

You can use this handy Storybook hook in your addon if you need to read or update [`args`](../writing-stories/args.md).

---

## Storybook API

Storybook API allows you to access different functionalities of Storybook UI. You can move an instance to the Storybook API when registering an addon.

Let's have a look at API methods.

### api.selectStory()

With this method, you can select a story via an API. This method accepts two parameters.

1.  story kind name
2.  story name (optional)

Let's say you've got a story like this:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/button-story-with-addon-example.js.mdx',
    'vue/button-story-with-addon-example.js.mdx',
    'angular/button-story-with-addon-example.ts.mdx',
    'svelte/button-story-with-addon-example.js.mdx',
    'svelte/button-story-with-addon-example.native-format.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

This is how you can select the above story:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-selectstory.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### api.selectInCurrentKind()

Same as `selectStory`, but accepts a story inside current kind as the only parameter:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-selectincurrentkind.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### api.setQueryParams()

This method allows you to set query string parameters. You can use that as temporary storage for addons. Here's how you define query params:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-setqueryparams.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

<div class="aside">

💡 If you need to remove a query param, use `null` for that. For example, we need to remove the `bbc` query param. See below how to do it:

</div>

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-disablequeryparams.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### api.getQueryParam()

This method allows you to get a query param set by the above API `setQueryParams`. For example, we need to get the `bbc` query param. Then this is how we do it:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-getqueryparam.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### api.getUrlState(overrideParams)

This method allows you to get the application URL state with some changed params. For example, if you want to get a link to a particular story:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-geturlstate.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### api.on(eventName, fn)

This method allows you to register a handler function called whenever the user navigates between stories.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-addons-api-on.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### addons.setConfig(config)

This method allows you to override the default Storybook UI configuration (e.g., set up a [theme](../configure/theming.md) or hide UI elements):

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-config-layout.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The following table details how to use the API values:

| Name                |     Type      |                    Description                     |             Example Value             |
| ------------------- | :-----------: | :------------------------------------------------: | :-----------------------------------: |
| **isFullscreen**    |    Boolean    |        Show story component as full screen         |                `false`                |
| **showNav**         |    Boolean    |     Display panel that shows a list of stories     |                `true`                 |
| **showPanel**       |    Boolean    |   Display panel that shows addon configurations    |                `true`                 |
| **panelPosition**   | String/Object |           Where to show the addon panel            |          `bottom` or `right`          |
| **enableShortcuts** |    Boolean    |              Enable/disable shortcuts              |                `true`                 |
| **isToolshown**     |    Boolean    |                 Show/hide tool bar                 |                `true`                 |
| **theme**           |    Object     |         Storybook Theme, see next section          |              `undefined`              |
| **selectedPanel**   |    String     |            Id to select an addon panel             |       `storybook/actions/panel`       |
| **initialActive**   |    String     |      Select the default active tab on Mobile       |   `sidebar` or `canvas` or `addons`   |
| **sidebar**         |    Object     |             Sidebar options, see below             |        `{ showRoots: false }`         |
| **toolbar**         |    Object     | Modify the tools in the toolbar using the addon id | `{ fullscreen: { hidden: false } } }` |

The following options are configurable under the `sidebar` namespace:

| Name               |   Type   |                          Description                          |                  Example Value                   |
| ------------------ | :------: | :-----------------------------------------------------------: | :----------------------------------------------: |
| **showRoots**      | Boolean  |    Display the top-level nodes as a "root" in the sidebar     |                     `false`                      |
| **collapsedRoots** |  Array   |     Set of root node IDs to visually collapse by default      |               `['misc', 'other']`                |
| **renderLabel**    | Function | Create a custom label for tree nodes; must return a ReactNode | `(item) => <abbr title="...">{item.name}</abbr>` |

The following options are configurable under the `toolbar` namespace:

| Name   |  Type  |            Description             |    Example Value    |
| ------ | :----: | :--------------------------------: | :-----------------: |
| **id** | String | Toggle visibility for toolbar item | `{ hidden: false }` |