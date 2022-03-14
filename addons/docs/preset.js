const { findDistEsm } = require('@storybook/core-common');
const { webpack } = require('./dist/cjs/frameworks/common/preset');

function managerEntries(entry = [], options) {
  return [...entry, findDistEsm(__dirname, 'register')];
}

function config(entry = [], options = {}) {
  return [findDistEsm(__dirname, 'frameworks/common/config'), ...entry];
}

module.exports = {
  webpack,
  managerEntries,
  config,
};
