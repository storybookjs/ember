/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');

function getCommand(watch) {
  const args = [
    '--outDir ./dist/ts3.9',
    '--listEmittedFiles false',
    '--declaration true',
    '--noErrorTruncation',
    '--pretty',
  ];

  /**
   * Only emit declarations if it does not need to be compiled with tsc
   * Currently, angular and storyshots (that contains an angular component) need to be compiled
   * with tsc. (see comments in compile-babel.js)
   */
  const isAngular = process.cwd().includes(path.join('app', 'angular'));
  const isStoryshots = process.cwd().includes(path.join('addons', 'storyshots'));
  if (!isAngular && !isStoryshots) {
    args.push('--emitDeclarationOnly');
  }

  if (watch) {
    args.push('-w', '--preserveWatchOutput');
  }

  return `yarn run -T tsc ${args.join(' ')}`;
}

function handleExit(code, stderr, errorCallback) {
  if (code !== 0) {
    if (errorCallback && typeof errorCallback === 'function') {
      errorCallback(stderr);
    }

    process.exit(code);
  }
}

async function run({ watch, silent, errorCallback }) {
  return new Promise((resolve, reject) => {
    const command = getCommand(watch);

    const child = execa.command(command, {
      buffer: false,
    });
    let stderr = '';

    if (watch) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    } else {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      child.stdout.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('exit', (code) => {
      resolve();
      handleExit(code, stderr, errorCallback);
    });
  });
}

async function tscfy(options = {}) {
  const { watch = false, silent = false, errorCallback } = options;
  const tsConfigFile = 'tsconfig.json';

  if (!(await fs.pathExists(tsConfigFile))) {
    if (!silent) {
      console.log(`No ${tsConfigFile}`);
    }
    return;
  }

  const tsConfig = await fs.readJSON(tsConfigFile);

  if (!(tsConfig && tsConfig.lerna && tsConfig.lerna.disabled === true)) {
    await run({ watch, silent, errorCallback });
  }

  if (!watch) {
    await execa.command('yarn run -T downlevel-dts dist/ts3.9 dist/ts3.4');
  }
}

module.exports = {
  tscfy,
};
