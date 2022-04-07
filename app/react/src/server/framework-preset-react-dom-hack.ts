import { readJSON } from 'fs-extra';
import { Configuration, IgnorePlugin } from 'webpack';

// this is a hack to allow importing react-dom/client even when it's not available
// this should be removed once we drop support for react-dom < 18

export async function webpackFinal(config: Configuration) {
  const reactDomPkg = await readJSON(require.resolve('react-dom/package.json'));

  return {
    ...config,
    plugins: [
      ...config.plugins,
      reactDomPkg.version.startsWith('18') || reactDomPkg.version.startsWith('0.0.0')
        ? null
        : new IgnorePlugin({
            resourceRegExp: /react-dom\/client$/,
            contextRegExp: /(app\/react|@storybook\/react)/, // TODO this needs to work for both in our MONOREPO and in the user's NODE_MODULES
          }),
    ].filter(Boolean),
  };
}
