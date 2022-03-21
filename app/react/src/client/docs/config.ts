import type { PartialStoryFn } from '@storybook/csf';
import { extractComponentDescription, enhanceArgTypes } from '@storybook/docs-tools';

import { ReactFramework } from '..';
import { extractArgTypes } from './extractArgTypes';
import { jsxDecorator } from './jsxDecorator';

export const parameters = {
  docs: {
    inlineStories: true,
    // NOTE: that the result is a react element. Hooks support is provided by the outer code.
    prepareForInline: (storyFn: PartialStoryFn<ReactFramework>) => storyFn(),
    extractArgTypes,
    extractComponentDescription,
  },
};

export const decorators = [jsxDecorator];

export const argTypesEnhancers = [enhanceArgTypes];
