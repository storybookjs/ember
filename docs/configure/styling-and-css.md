---
title: 'Styling and CSS'
---

There are many ways to include CSS in a web application, and correspondingly there are many ways to include CSS in Storybook. Usually, it is best to try and replicate what your application does with styling in Storybook’s configuration.

### CSS-in-JS

CSS-in-JS libraries are designed to use basic JavaScript, and they often work in Storybook without any extra configuration. Some libraries expect components to render in a specific rendering “context” (for example, to provide themes), and you may need to add a [global decorator](../writing-stories/decorators.md#global-decorators) to supply it.

### Importing CSS files

If your component files import their CSS, Storybook's webpack configuration will work out of the box. The noticeable exception to this is if you're using a CSS precompiler. In this case, you can either install and configure a Storybook preset (e.g., [SCSS preset](https://github.com/storybookjs/presets/tree/master/packages/preset-scss)), or customize [Storybook's webpack configuration](./webpack#extending-storybooks-webpack-config) and include the appropriate loader.

<FeatureSnippets paths={['configure/css-troubleshooting/angular.mdx']} />

To use your CSS in all stories, you import it in [`.storybook/preview.js`](./overview.md#configure-story-rendering)

### Adding webfonts

If you need webfonts to be available, you may need to add some code to the [`.storybook/preview-head.html`](./story-rendering.md#adding-to-head) file. We recommend including any assets with your Storybook if possible, in which case you likely want to configure the [static file location](./images-and-assets#serving-static-files-via-storybook).