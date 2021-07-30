import React from 'react';

import { Story } from './types-6-3';
import renderToDOM from './render';

export const render: Story = (args, { id, component: Component }) => {
  if (!Component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }
  return <Component {...args} />;
};

export { renderToDOM };
