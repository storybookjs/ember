import React from 'react';
import pLimit from 'p-limit';
import { nanoid } from 'nanoid';

import { AngularFramework, StoryContext } from '@storybook/angular';
import { rendererFactory } from '@storybook/angular/renderer';
import { PartialStoryFn } from '@storybook/csf';

const limit = pLimit(1);

/**
 * Uses the angular renderer to generate a story. Uses p-limit to run synchronously
 */
export const prepareForInline = (
  storyFn: PartialStoryFn<AngularFramework>,
  { id, parameters }: StoryContext
) => {
  return React.createElement('div', {
    ref: async (node?: HTMLDivElement): Promise<void> => {
      if (!node) {
        return null;
      }

      return limit(async () => {
        const renderer = await rendererFactory.getRendererInstance(`${id}-${nanoid(10)}`, node);
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
