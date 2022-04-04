import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { Welcome } from '@storybook/react/demo';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

export default {
  title: 'Welcome',
  component: Welcome,
} as ComponentMeta<typeof Welcome>;

export const ToStorybook: ComponentStory<typeof Welcome> = () => (
  <Welcome showApp={linkTo('Button')} />
);

ToStorybook.storyName = 'to Storybook';
