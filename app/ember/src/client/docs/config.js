import { enhanceArgTypes } from '@storybook/docs-tools';
import { extractArgTypes, extractComponentDescription } from './jsondoc';

export const parameters = {
  docs: {
    iframeHeight: 80,
    extractArgTypes,
    extractComponentDescription,
  },
};

export const argTypesEnhancers = [enhanceArgTypes];
