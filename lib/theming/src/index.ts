// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./typings.d.ts" />

import emotionStyled from '@emotion/styled';

export type { StyledComponent } from '@emotion/styled';
export {
  Global,
  keyframes,
  css,
  jsx,
  ClassNames,
  withTheme,
  useTheme,
  ThemeProvider,
} from '@emotion/react';
export type { CSSObject, Keyframes } from '@emotion/react';

export const styled = emotionStyled;

export * from './base';
export * from './types';

export { default as isPropValid } from '@emotion/is-prop-valid';

export { createGlobal, createReset } from './global';
export * from './create';
export * from './convert';
export * from './ensure';

export { lightenColor as lighten, darkenColor as darken } from './utils';

export const ignoreSsrWarning =
  '/* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */';
