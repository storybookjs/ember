import React from 'react';
import { Global, ThemeProvider, convert, createReset, themes } from '@storybook/theming';

export const decorators = [
  (StoryFn) => (
    <ThemeProvider theme={convert(themes.light)}>
      <Global styles={createReset} />
      <StoryFn />
    </ThemeProvider>
  ),
];
