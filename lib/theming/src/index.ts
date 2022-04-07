// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./typings.d.ts" />

import emotionStyled from '@emotion/styled';
import * as emotionReact from '@emotion/react';
// TODO: when releasing 7.0 this should be removed and code should be upgraded to use Emotion 11 types
import type { CreateStyled, PropsOf, AddOptionalTo } from './emotion10types';

import { Theme } from './types';

export type { StyledComponent } from './emotion10types';

export { keyframes, css, jsx, ClassNames, ThemeProvider, CacheProvider } from '@emotion/react';
export type { CSSObject, Keyframes } from '@emotion/react';

export const useTheme = emotionReact.useTheme as <TTheme = Theme>() => TTheme;
export const withTheme = emotionReact.withTheme as <C extends React.ComponentType<any>>(
  component: C
) => React.FC<AddOptionalTo<PropsOf<C>, 'theme'>>;

export const Global = emotionReact.Global as (props: {
  styles: emotionReact.Interpolation<Theme>;
}) => React.ReactElement;

export const styled = emotionStyled as CreateStyled<Theme>;

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
