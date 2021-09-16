function config(entry = []) {
  return [...entry, require.resolve('./dist/esm/client/preview/config')];
}

module.exports = {
  config,
};
