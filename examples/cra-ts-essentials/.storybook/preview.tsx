import React from 'react';
import type { DecoratorFn } from '@storybook/react';
import { ThemeProvider, convert, themes } from '@storybook/theming';

export const decorators: DecoratorFn[] = [
  (StoryFn, { globals: { locale } }) => (
    <>
      <div>Locale: {locale}</div>
      <StoryFn />
    </>
  ),
  (StoryFn) => (
    <ThemeProvider theme={convert(themes.light)}>
      <StoryFn />
    </ThemeProvider>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};

export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      dynamicTitle: true,
      icon: 'globe',
      items: [
        { value: 'en', right: '🇺🇸', title: 'English' },
        { value: 'es', right: '🇪🇸', title: 'Español' },
        { value: 'zh', right: '🇨🇳', title: '中文' },
        { value: 'kr', right: '🇰🇷', title: '한국어' },
      ],
    },
  },
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    toolbar: {
      dynamicTitle: true,
      icon: 'circlehollow',
      title: 'Theme',
      items: [
        { value: 'light', icon: 'circlehollow', title: 'Light' },
        { value: 'dark', icon: 'circle', title: 'Dark' },
        { value: 'side-by-side', icon: 'sidebar', title: 'Side by side' },
        { value: 'stacked', icon: 'bottombar', title: 'Stacked' },
      ],
    },
  },
};
