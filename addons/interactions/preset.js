function config(entry = []) {
  return [...entry, require.resolve('./dist/esm/preset/preview')];
}

function managerEntries(entry = []) {
  return [...entry, require.resolve('./dist/esm/preset/manager')];
}

function webpack(config = {}, options = {}) {
  const sourceLoader = {
    loader: require.resolve('@storybook/source-loader'),
    options: options.loaderOptions,
  }
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        {
          test: [/\.stories\.(jsx?$|tsx?$)/],
          ...options.rule,
          enforce: 'pre',
          use: [sourceLoader],
        },
      ],
    },
  };
}

module.exports = {
  config,
  managerEntries,
  webpack,
};
