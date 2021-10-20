function config(entry = []) {
  return [...entry, require.resolve('./dist/ts3.9/client/preview/config')];
}

module.exports = {
  config,
};
