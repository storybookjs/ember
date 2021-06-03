import React from 'react';
import pLimit from 'p-limit';

import { IStory, StoryContext } from '@storybook/angular';
import { rendererFactory } from '@storybook/angular/renderer';
import { StoryFn } from '@storybook/addons';

const limit = pLimit(1);

/**
 * Uses the angular renderer to generate a story. Uses p-limit to run synchronously
 */
export const prepareForInline = (storyFn: StoryFn<IStory>, { id, parameters }: StoryContext) => {
  return React.createElement('div', {
    ref: async (node?: HTMLDivElement): Promise<void> => {
      if (!node) {
        return null;
      }

      return limit(() => rendererFactory.getRendererInstance(id, node)).then(async (renderer) => {
        await renderer.render({
          forced: false,
          parameters,
          storyFnAngular: storyFn(),
          targetDOMNode: node,
        });
      });
    },
  });
};
