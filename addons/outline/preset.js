function config(entry = []) {
  return [...entry, require.resolve('./dist/esm/preset/addDecorator')];
}

function managerEntries(entry = [], options) {
  return [...entry, require.resolve('./dist/esm/manager')];
}

module.exports = {
  managerEntries,
  config,
};
