---
title: 'Vite'
---

Storybook Vite builder bundles your components and stories with [Vite](https://vitejs.dev/), a fast ESM bundler.

- For applications built with Vite: it allows reusing the existing configuration in Storybook.
- For applications built with Webpack: it provides faster startup and refresh times, with the disadvantage that your component's execution environment differs from your application.

## Setup

If you ran `npx sb init` to include Storybook in your Vite application, the builder is already installed and configured for you. If you want, you can also opt into it manually.

Run the following command to install the builder.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-install.yarn.js.mdx',
    'common/storybook-vite-builder-install.npm.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

Update your Storybook configuration (in `.storybook/main.js|ts`) to include the builder.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-register.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

## Configuration

Out of the box, Storybook's Vite builder includes a set of configuration defaults for the supported frameworks. You can also fine-tune them or override them to match your existing configuration as, by default, the builder does not read your `vite.config.js` file. For example, if you need to set up aliasing, you can adjust your Storybook configuration file (`.storybook/main.js|ts`) and provide the following:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-aliasing.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

The asynchronous function`viteFinal` receives a `config` object with the default builder configuration and returns the updated configuration with the defined alias.

You can also override the builder's configuration based on the environment. For instance, if you need to provide a custom configuration for development purposes and another for production, you can extend the default configuration as follows:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-config-env.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Svelte configuration

If you're working with Svelte's Vite plugin ([`vite-plugin-svelte`](https://github.com/sveltejs/vite-plugin-svelte/tree/main/packages/vite-plugin-svelte)), you can extend your existing configuration and include an additional `SvelteOptions` object to customize it. For example:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-svelte-plugin.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### TypeScript

If you need, you can also configure Storybook's Vite builder using TypeScript. Rename your `.storybook/main.js` to `.storybook/main.ts` and adjust it as follows:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-ts-configure.ts.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

---

## Troubleshooting

### Working directory not being detected

By default, the Vite builder enables Vite's [`server.fs.strict`](https://vitejs.dev/config/#server-fs-strict) option for increased security, defining the project's `root` to Storybook's configuration directory
If you need to override it, you can use the `viteFinal` function and adjust it.

### ArgTypes are not generated automatically

Currently, [automatic argType inference](../api/argtypes.md#automatic-argtype-inference) is only available for React and Vue3. With React, the Vite builder defaults to `react-docgen-typescript` if TypeScript is listed as a dependency. If you run into any issues, you can revert to `react-docgen` by updating your Storybook configuration file as follows:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'common/storybook-vite-builder-react-docgen.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

#### Learn more about builders

- Vite builder for bundling with Vite
- [Webpack builder](./webpack.md) for bundling with Webpack
- [Builder API](./builder-api.md) for building a Storybook builder
