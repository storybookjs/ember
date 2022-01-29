/// <reference types="@types/compression" />

declare module 'lazy-universal-dotenv';
declare module 'pnp-webpack-plugin';
declare module '@storybook/semver';

declare namespace jest {
  interface Matchers<R> {
    toMatchPaths(paths: string[]): R;
  }
}