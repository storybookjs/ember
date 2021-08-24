import { Framework, StoryFn } from '@storybook/csf';

import React from 'react';

// @ts-ignore
import HOC from './HOC.svelte';

export const prepareForInline = (storyFn: StoryFn<Framework>) => {
  const el = React.useRef(null);
  React.useEffect(() => {
    const root = new HOC({
      target: el.current,
      props: {
        storyFn,
      },
    });
    return () => root.$destroy();
  });

  return React.createElement('div', { ref: el });
};
