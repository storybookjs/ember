/* eslint-disable */
/* global window */

import {
  addParameters,

  // setCustomElementsManifest,
  // ☝️☝️☝️☝️☝️☝️
  // @TODO: cant import this function for some reason after running `yarn bootstrap --core`
  setCustomElements,
} from '@storybook/web-components';

import customElements from '../custom-elements.json';
import customElementsV1 from '../custom-elements-v1.json';

/**
 * @TODO: Need to remove this, but had to use it to test, because I cant seem to import the function
 */
// eslint-disable-next-line
function setCustomElementsManifest(customElements) {
  // eslint-disable-next-line
  // @ts-ignore
  window.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__ = customElements;
}

setCustomElementsManifest(customElementsV1);
// setCustomElements(customElements);
  

addParameters({
  a11y: {
    config: {},
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },
  docs: {
    iframeHeight: '200px',
  },
});
