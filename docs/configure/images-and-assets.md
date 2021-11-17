---
title: 'Images, fonts, and assets'
---

Components often rely on images, videos, fonts, and other assets to render as the user expects. There are many ways to use these assets in your story files.

### Import assets into stories

You can import any media assets by importing (or requiring) them. This works out of the box with our default config. But, if you are using a custom webpack config, you’ll need to add the file-loader to handle the required files.

Afterwards you can use any asset in your stories:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/component-story-static-asset-with-import.js.mdx',
    'react/component-story-static-asset-with-import.mdx.mdx',
    'vue/component-story-static-asset-with-import.2.js.mdx',
    'vue/component-story-static-asset-with-import.mdx-2.mdx.mdx',
    'vue/component-story-static-asset-with-import.3.js.mdx',
    'vue/component-story-static-asset-with-import.mdx-3.mdx.mdx',
    'angular/component-story-static-asset-with-import.ts.mdx',
    'angular/component-story-static-asset-with-import.mdx.mdx',
    'svelte/component-story-static-asset-with-import.js.mdx',
    'svelte/component-story-static-asset-with-import.native-format.mdx',
    'svelte/component-story-static-asset-with-import.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Serving static files via Storybook Configuration

We recommend serving static files via Storybook to ensure that your components always have the assets they need to load. This technique is recommended for assets that your components often use like logos, fonts, and icons.

Configure a directory (or a list of directories) where your assets live in your Storybook configuration. Use the `staticDirs` property in your `main.js` or `main.ts` configuration file like so:

```js
{
  ...
  staticDirs: ['./public'];
  ...
}
```

You can map your local static directories to a different path like this:

```js
{
  ...
  staticDirs: [{ from: './public', to: '/assets' }];
  ...
}
```

Here `./public` is your static directory. Now use it in a component or story like this.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/component-story-static-asset-without-import.js.mdx',
    'react/component-story-static-asset-without-import.mdx.mdx',
    'vue/component-story-static-asset-without-import.js.mdx',
    'vue/component-story-static-asset-without-import.mdx.mdx',
    'angular/component-story-static-asset-without-import.ts.mdx',
    'angular/component-story-static-asset-without-import.mdx.mdx',
    'svelte/component-story-static-asset-without-import.js.mdx',
    'svelte/component-story-static-asset-without-import.native-format.mdx',
    'svelte/component-story-static-asset-without-import.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

You can also pass a list of directories separated by commas without spaces instead of a single directory.

```js
{
  ...
  staticDirs: ['./public', './statics'];
  ...
}
```

Or you can map each of them to different paths:

You can map your local static directories to a different path like this:

```js
{
  ...
  staticDirs: [
    { from: './public', to: '/assets' },
    { from: './statics', to: '/resources' }
  ];
  ...
}
```

### **[⚠️ Deprecated]** Serving static files via Storybook CLI

Using `--static-dir` or `-s` option with Storybook CLI is deprecated. It is recommended to use [Storybook static directory configuration option](#serving-static-files-via-storybook-configuration) instead.

### Reference assets from a CDN

Upload your files to an online CDN and reference them. In this example we’re using a placeholder image service.

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'react/component-story-static-asset-cdn.js.mdx',
    'react/component-story-static-asset-cdn.mdx.mdx',
    'vue/component-story-static-asset-cdn.js.mdx',
    'vue/component-story-static-asset-cdn.mdx.mdx',
    'angular/component-story-static-asset-cdn.ts.mdx',
    'angular/component-story-static-asset-cdn.mdx.mdx',
    'svelte/component-story-static-asset-cdn.js.mdx',
    'svelte/component-story-static-asset-cdn.native-format.mdx',
    'svelte/component-story-static-asset-cdn.mdx.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

### Absolute versus relative paths

Sometimes, you may want to deploy your storybook into a subpath, like `https://example.com/storybook`.

In this case, you need to have all your images and media files with relative paths. Otherwise, the browser cannot locate those files.

If you load static content via importing, this is automatic and you do not have to do anything.

If you are serving assets in a [static directory](#serving-static-files-via-storybook) along with your Storybook, then you need to use relative paths to load images or use the base element.
