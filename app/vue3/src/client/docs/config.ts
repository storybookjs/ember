import { extractComponentDescription, enhanceArgTypes } from '@storybook/docs-tools';
import { extractArgTypes } from './extractArgTypes';
import { prepareForInline } from './prepareForInline';

export const parameters = {
  docs: {
    inlineStories: true,
    prepareForInline,
    extractArgTypes,
    extractComponentDescription,
  },
};

export const argTypesEnhancers = [enhanceArgTypes];
