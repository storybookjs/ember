import { setCustomElementsManifest } from '@storybook/web-components';

import customElementsManifest from '../custom-elements.json';

setCustomElementsManifest(customElementsManifest);

// TODO: Remove support of 0.x CustomElementManifest format in 7.0
// import customElements from '../custom-elements-experimental.json';
// setCustomElements(customElements);

export const parameters = {
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
};

export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', right: '🇺🇸', title: 'English' },
        { value: 'es', right: '🇪🇸', title: 'Español' },
        { value: 'fr', right: '🇫🇷', title: 'Français' },
        { value: 'zh', right: '🇨🇳', title: '中文' },
        { value: 'kr', right: '🇰🇷', title: '한국어' },
      ],
    },
  },
};
