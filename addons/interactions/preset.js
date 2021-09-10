const { checkActionsLoaded } = require('./dist/cjs/preset/checkActionsLoaded');

function config(entry = []) {
  return [...entry, require.resolve('./dist/esm/preset/argsEnhancers')];
}

function managerEntries(entry = [], options) {
  checkActionsLoaded(options.configDir);
  return [...entry, require.resolve('./dist/esm/register')];
}

module.exports = {
  config,
  managerEntries,
};
