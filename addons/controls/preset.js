const { checkDocsLoaded } = require('./dist/cjs/preset/checkDocsLoaded');

function managerEntries(entry = [], options) {
  checkDocsLoaded(options.configDir);
  return [...entry, require.resolve('./dist/esm/register')];
}

module.exports = { managerEntries };
