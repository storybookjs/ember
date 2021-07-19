import global from 'global';

import './angular-polyfills';

const { window: globalWindow } = global;

globalWindow.STORYBOOK_ENV = 'angular';
