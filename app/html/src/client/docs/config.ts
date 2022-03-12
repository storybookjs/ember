import { SourceType } from '@storybook/docs-tools';
import { sourceDecorator } from './sourceDecorator';
import { prepareForInline } from './prepareForInline';

export const decorators = [sourceDecorator];

export const parameters = {
  docs: {
    inlineStories: true,
    prepareForInline,
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
    },
  },
};
