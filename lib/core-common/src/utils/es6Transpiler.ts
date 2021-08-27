import { RuleSetRule } from 'webpack';
import { getStorybookBabelConfig } from './babel';

const { plugins } = getStorybookBabelConfig();

const nodeModulesThatNeedToBeParsedBecauseTheyExposeES6 = [
  '@storybook[\\\\/]node_logger',
  '@testing-library[\\\\/]dom',
  '@testing-library[\\\\/]user-event',
  'acorn-jsx',
  'ansi-align',
  'ansi-colors',
  'ansi-escapes',
  'ansi-regex',
  'ansi-styles',
  'better-opn',
  'boxen',
  'chalk',
  'color-convert',
  'commander',
  'find-cache-dir',
  'find-up',
  'fs-extra',
  'highlight.js',
  'json5',
  'node-fetch',
  'pkg-dir',
  'prettier',
  'pretty-format',
  'resolve-from',
  'semver',
  'slash',
].map((n) => new RegExp(`[\\\\/]node_modules[\\\\/]${n}`));

export const es6Transpiler: () => RuleSetRule = () => {
  const include = (input: string) => {
    return !!nodeModulesThatNeedToBeParsedBecauseTheyExposeES6.find((p) => input.match(p));
  };
  return {
    test: /\.js$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: {
          sourceType: 'unambiguous',
          presets: [
            [
              require.resolve('@babel/preset-env'),
              {
                shippedProposals: true,
                modules: false,
                loose: true,
                targets: 'defaults',
              },
            ],
            require.resolve('@babel/preset-react'),
          ],
          plugins,
        },
      },
    ],
    include,
  };
};
