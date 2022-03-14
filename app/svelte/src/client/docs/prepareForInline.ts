/* eslint-disable import/no-extraneous-dependencies */
import { AnyFramework, StoryFn } from '@storybook/csf';

import React from 'react';

// @ts-ignore
import HOC from '@storybook/svelte/src/client/docs/HOC.svelte';

export const prepareForInline = (storyFn: StoryFn<AnyFramework>) => {
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
