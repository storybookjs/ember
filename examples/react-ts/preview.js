import React from 'react';
import { ThemeProvider, convert, themes } from '@storybook/theming';

export const parameters = {
  options: {
    // storySort: (a, b) => (
    //   a[1].title === b[1].title
    //     ? 0
    //     : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
    // ),
    storySort: ['Examples', 'Docs', 'Demo'],
  },
};

export const decorators = [
  (StoryFn) => (
    <ThemeProvider theme={convert(themes.light)}>
      <StoryFn />
    </ThemeProvider>
  ),
];
