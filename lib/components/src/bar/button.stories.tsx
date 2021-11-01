import React from 'react';

import { IconButton } from './button';
import { Icons } from '../icon/icon';

export default {
  component: IconButton,
  title: 'Basics/IconButton',
};

// eslint-disable-next-line no-underscore-dangle
export const _IconButton = () => (
  <IconButton>
    <Icons icon="bookmark" />
  </IconButton>
);

export const Active = () => (
  <IconButton active>
    <Icons icon="beaker" />
  </IconButton>
);

export const WithText = () => (
  <IconButton>
    <Icons icon="circlehollow" />
    &nbsp;Howdy!
  </IconButton>
);

export const WithTextActive = () => (
  <IconButton active>
    <Icons icon="circlehollow" />
    &nbsp;Howdy!
  </IconButton>
);
