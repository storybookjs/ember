import ReactDocgenTypescriptPlugin from '@storybook/react-docgen-typescript-plugin';
import type { TypescriptConfig } from '@storybook/core-common';
import * as preset from './framework-preset-react-docs';

describe('framework-preset-react-docgen', () => {
  const babelPluginReactDocgenPath = require.resolve('babel-plugin-react-docgen');
  const presetsListWithDocs = [{ name: '@storybook/addon-docs', options: {}, preset: null }];

  describe('react-docgen', () => {
    it('should return the babel config with the extra plugin', async () => {
      const babelConfig = {
        babelrc: false,
        presets: ['env', 'foo-preset'],
        plugins: ['foo-plugin'],
      };

      const config = await preset.babel(babelConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: 'react-docgen',
            } as TypescriptConfig),
        },
        presetsList: presetsListWithDocs,
      } as any);

      expect(config).toEqual({
        babelrc: false,
        plugins: ['foo-plugin'],
        presets: ['env', 'foo-preset'],
        overrides: [
          {
            test: /\.(mjs|tsx?|jsx?)$/,
            plugins: [
              [
                babelPluginReactDocgenPath,
                {
                  DOC_GEN_COLLECTION_NAME: 'STORYBOOK_REACT_CLASSES',
                },
              ],
            ],
          },
        ],
      });
    });
  });

  describe('react-docgen-typescript', () => {
    it('should return the webpack config with the extra plugin', async () => {
      const webpackConfig = {
        plugins: [],
      };

      const config = await preset.webpackFinal(webpackConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: 'react-docgen-typescript',
            } as TypescriptConfig),
        },
        presetsList: presetsListWithDocs,
      });

      expect(config).toEqual({
        plugins: [expect.any(ReactDocgenTypescriptPlugin)],
      });
    });
  });

  describe('no docgen', () => {
    it('should not add any extra plugins', async () => {
      const babelConfig = {
        babelrc: false,
        presets: ['env', 'foo-preset'],
        plugins: ['foo-plugin'],
      };

      const webpackConfig = {
        plugins: [],
      };

      const outputBabelconfig = await preset.babel(babelConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: false,
            } as TypescriptConfig),
        },
        presetsList: presetsListWithDocs,
      });
      const outputWebpackconfig = await preset.webpackFinal(webpackConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: false,
            } as TypescriptConfig),
        },
        presetsList: presetsListWithDocs,
      });

      expect(outputBabelconfig).toEqual({
        babelrc: false,
        presets: ['env', 'foo-preset'],
        plugins: ['foo-plugin'],
      });
      expect(outputWebpackconfig).toEqual({
        plugins: [],
      });
    });
  });

  describe('no docs or controls addon used', () => {
    it('should not add any extra plugins', async () => {
      const babelConfig = {
        babelrc: false,
        presets: ['env', 'foo-preset'],
        plugins: ['foo-plugin'],
      };

      const webpackConfig = {
        plugins: [],
      };

      const outputBabelconfig = await preset.babel(babelConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: 'react-docgen-typescript',
            } as TypescriptConfig),
        },
        presetsList: [],
      });
      const outputWebpackconfig = await preset.webpackFinal(webpackConfig, {
        presets: {
          // @ts-ignore
          apply: async () =>
            ({
              check: false,
              reactDocgen: 'react-docgen-typescript',
            } as TypescriptConfig),
        },
        presetsList: [],
      });

      expect(outputBabelconfig).toEqual({
        babelrc: false,
        presets: ['env', 'foo-preset'],
        plugins: ['foo-plugin'],
      });
      expect(outputWebpackconfig).toEqual({
        plugins: [],
      });
    });
  });
});
