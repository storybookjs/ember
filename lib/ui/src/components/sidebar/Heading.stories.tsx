import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ThemeProvider, useTheme, Theme } from '@storybook/theming';
import { action } from '@storybook/addon-actions';
import { screen } from '@testing-library/dom';

import { Heading } from './Heading';

type Story = ComponentStory<typeof Heading>;

export default {
  component: Heading,
  title: 'UI/Sidebar/Heading',
  excludeStories: /.*Data$/,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (storyFn) => <div style={{ padding: '0 20px', maxWidth: '230px' }}>{storyFn()}</div>,
  ],
} as ComponentMeta<typeof Heading>;

const menuItems = [
  { title: 'Menu Item 1', onClick: action('onActivateMenuItem'), id: '1' },
  { title: 'Menu Item 2', onClick: action('onActivateMenuItem'), id: '2' },
  { title: 'Menu Item 3', onClick: action('onActivateMenuItem'), id: '3' },
];

export const menuHighlighted: Story = () => <Heading menuHighlighted menu={menuItems} />;

export const standardData = { menu: menuItems };

export const standard: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: undefined,
          url: undefined,
          image: undefined,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const standardNoLink: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: undefined,
          url: null,
          image: undefined,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const linkAndText: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My title',
          url: 'https://example.com',
          image: null,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const onlyText: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My title',
          url: null,
          image: null,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const longText: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My title is way to long to actually fit',
          url: null,
          image: null,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const customBrandImage: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My Title',
          url: 'https://example.com',
          image: 'https://via.placeholder.com/150x22',
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const customBrandImageTall: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My Title',
          url: 'https://example.com',
          image: 'https://via.placeholder.com/100x150',
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const customBrandImageUnsizedSVG: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: 'My Title',
          url: 'https://example.com',
          image: 'https://s.cdpn.io/91525/potofgold.svg',
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const noBrand: Story = () => {
  const theme = useTheme() as Theme;
  return (
    <ThemeProvider
      theme={{
        ...theme,
        brand: {
          title: null,
          url: null,
          image: null,
        },
      }}
    >
      <Heading menu={menuItems} />
    </ThemeProvider>
  );
};

export const skipToCanvasLinkFocused: Story = {
  args: { menu: menuItems, skipLinkHref: '#storybook-preview-wrapper' },
  parameters: { layout: 'padded', chromatic: { delay: 300 } },
  play: () => {
    // focus each instance for chromatic/storybook's stacked theme
    screen.getAllByText('Skip to canvas').forEach((x) => x.focus());
  },
};
