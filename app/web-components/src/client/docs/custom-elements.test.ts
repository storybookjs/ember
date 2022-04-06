/* eslint-disable no-underscore-dangle */
import global from 'global';
import { extractArgTypes } from './custom-elements';
import customElementsManifest from './__testfixtures__/custom-elements.json';

declare global {
  interface Window {
    __STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__: any;
  }
}

const { window } = global;

describe('extractArgTypes', () => {
  beforeEach(() => {
    window.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__ = customElementsManifest;
  });

  afterEach(() => {
    window.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__ = undefined;
  });

  describe('events', () => {
    it('should map to an action event handler', () => {
      const { onSbHeaderCreateAccount } = extractArgTypes('sb-header');

      expect(onSbHeaderCreateAccount).toEqual({
        name: 'onSbHeaderCreateAccount',
        action: { name: 'sb-header:createAccount' },
        table: { disable: true },
      });
    });

    it('should map to a regular item', () => {
      const { 'sb-header:createAccount': item } = extractArgTypes('sb-header');

      expect(item).toEqual({
        name: 'sb-header:createAccount',
        required: false,
        description: 'Event send when user clicks on create account button',
        type: { name: 'void' },
        table: {
          category: 'events',
          type: { summary: 'CustomEvent' },
          defaultValue: { summary: undefined },
        },
      });
    });
  });
});
