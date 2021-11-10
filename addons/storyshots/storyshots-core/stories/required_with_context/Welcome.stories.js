import React from 'react';

import { linkTo } from '@storybook/addon-links';
import { Welcome } from '@storybook/react/demo';

export default {
  title: 'Welcome',

  parameters: {
    component: Welcome,
  },
};

export const ToStorybook = () => <Welcome showApp={linkTo('Button')} />;

ToStorybook.storyName = 'to Storybook';
