function config(entry = []) {
  return [...entry, require.resolve('./dist/esm/preset/argsEnhancers')];
}

function managerEntries(entry = [], options) {
  // eslint-disable-next-line global-require
  const { checkActionsLoaded } = require('./dist/cjs/preset/checkActionsLoaded');
  checkActionsLoaded(options.configDir);
  return [...entry, require.resolve('./dist/esm/manager')];
}

module.exports = {
  config,
  managerEntries,
};
