import React from 'react';

import { IconButton } from './button';
import { Icons } from '../icon/icon';

export default {
  component: IconButton,
  title: 'Basics/IconButton',
};

export const Resting = () => (
  <IconButton>
    <Icons icon="bookmark" />
  </IconButton>
);

export const Active = () => (
  <IconButton active>
    <Icons icon="beaker" />
  </IconButton>
);
