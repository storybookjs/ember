import { setCompodocJson } from '@storybook/addon-docs/angular';
import addCssWarning from '../src/cssWarning';

/* eslint-disable import/extensions, import/no-unresolved */
// @ts-ignore
import docJson from '../documentation.json';
/* eslint-enable import/extensions, import/no-unresolved */
// remove ButtonComponent to test #12009
const filtered = !docJson?.components
  ? docJson
  : {
      ...docJson,
      components: docJson.components.filter((c) => c.name !== 'ButtonComponent'),
    };
setCompodocJson(filtered);

addCssWarning();

export const parameters = {
  docs: {
    inlineStories: true,
  },
  options: {
    storySort: {
      order: ['Welcome', 'Core ', 'Addons ', 'Basics '],
    },
  },
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light theme' },
        { value: 'dark', title: 'Dark theme' },
      ],
    },
  },
};
