import { extractComponentDescription } from '@storybook/docs-tools';
import { extractArgTypes } from './extractArgTypes';
import { prepareForInline } from './prepareForInline';
import { sourceDecorator } from './sourceDecorator';

console.log('hello2');

export const parameters = {
  foobar: 'baz',
  docs: {
    inlineStories: true,
    iframeHeight: 120,
    prepareForInline,
    extractArgTypes,
    extractComponentDescription,
  },
};

export const decorators = [sourceDecorator];
