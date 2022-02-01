---
title: 'Styling and CSS'
---

There are many ways to include CSS in a web application, and correspondingly there are many ways to include CSS in Storybook. Usually, it is best to try and replicate what your application does with styling in Storybook’s configuration.

### CSS-in-JS

CSS-in-JS libraries are designed to use basic JavaScript, and they often work in Storybook without any extra configuration. Some libraries expect components to render in a specific rendering “context” (for example, to provide themes), and you may need to add a [global decorator](../writing-stories/decorators.md#global-decorators) to supply it.

### Importing CSS files

If your component files import their CSS, Storybook’s webpack config will work unmodified with some exceptions:

- If you are using a CSS precompiler, you may need to add a preset (such as the [SCSS preset](https://github.com/storybookjs/presets/tree/master/packages/preset-scss), or add a loader to Storybook’s webpack config).
- In older versions of Angular, you'll need to take special care of how you handle CSS:

  - Either [customize your webpack config](./webpack#extending-storybooks-webpack-config)
  - Or use syntax to use a inline loader:

<!-- prettier-ignore-start -->

<CodeSnippets
  paths={[
    'angular/storybook-angular-inline-css-loader.js.mdx',
  ]}
/>

<!-- prettier-ignore-end -->

- With Angular version 13 and above, you should use a builder configuration to import your CSS:

```json
{
  "my-project": {
    "architect": {
      "build": {
        "builder": "@angular-devkit/build-angular:browser",
        "options": {
          "styles": ["src/styles.css", "src/styles.scss"]
        }
      }
    }
  }
}
```

- Or if you need Storybook specific styles that are separate from your application, you can configure the styles with [Storybook's custom builder](../get-started/install.md), which will override the application's styles:

```json
{
  "storybook": {
    "builder": "@storybook/angular:start-storybook",
    "options": {
      "browserTarget": "my-default-project:build",
      "styles": [".storybook/custom-styles.scss"]
    }
  }
}
```

To use your CSS in all stories, you import it in [`.storybook/preview.js`](./overview.md#configure-story-rendering)

### Adding webfonts

If you need webfonts to be available, you may need to add some code to the [`.storybook/preview-head.html`](./story-rendering.md#adding-to-head) file. We recommend including any assets with your Storybook if possible, in which case you likely want to configure the [static file location](./images-and-assets#serving-static-files-via-storybook).