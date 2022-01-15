/* eslint-disable storybook/use-storybook-testing-library */
// @TODO: use addon-interactions and remove the rule disable above
import React from 'react';
import { ComponentStory, ComponentMeta, ComponentStoryObj } from '@storybook/react';
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

export const MenuHighlighted: Story = () => <Heading menuHighlighted menu={menuItems} />;

export const standardData = { menu: menuItems };

export const Standard: Story = () => {
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

export const StandardNoLink: Story = () => {
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

export const LinkAndText: Story = () => {
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

export const OnlyText: Story = () => {
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

export const LongText: Story = () => {
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

export const CustomBrandImage: Story = () => {
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

export const CustomBrandImageTall: Story = () => {
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

export const CustomBrandImageUnsizedSVG: Story = () => {
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

export const NoBrand: Story = () => {
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

export const SkipToCanvasLinkFocused: ComponentStoryObj<typeof Heading> = {
  args: { menu: menuItems, skipLinkHref: '#storybook-preview-wrapper' },
  parameters: { layout: 'padded', chromatic: { delay: 300 } },
  play: () => {
    // focus each instance for chromatic/storybook's stacked theme
    screen.getAllByText('Skip to canvas').forEach((x) => x.focus());
  },
};
