/* eslint-disable no-console */
const path = require('path');
const shell = require('shelljs');
const chalk = require('chalk');
const fs = require('fs-extra');
const log = require('npmlog');
const readPkgUp = require('read-pkg-up');
const { babelify } = require('./utils/compile-babel');
const { tscfy } = require('./utils/compile-tsc');

async function removeDist() {
  await fs.remove('dist');
}

const ignore = [
  '__mocks__',
  '__snapshots__',
  '__testfixtures__',
  '__tests__',
  '/tests/',
  /.+\.test\..+/,
];

async function cleanup() {
  // remove files after babel --copy-files output
  // --copy-files option doesn't work with --ignore
  // https://github.com/babel/babel/issues/6226
  if (await fs.pathExists(path.join(process.cwd(), 'dist'))) {
    const isInStorybookCLIPackage = process.cwd().includes(path.join('lib', 'cli'));
    const filesToRemove = shell.find('dist').filter((filePath) => {
      // Do not remove folder
      // And do not clean anything for:
      // - @storybook/cli/dist/(esm|cjs)/generators/**/template*
      // - @storybook/cli/dist/(esm|cjs)/frameworks/*
      // because these are the template files that will be copied to init SB on users' projects

      if (
        fs.lstatSync(filePath).isDirectory() ||
        (isInStorybookCLIPackage &&
          /\/(esm|cjs)\/(generators\/.+\/template|frameworks).*/.test(filePath))
      ) {
        return false;
      }

      // Remove all copied TS files (but not the .d.ts)
      if (/\.tsx?$/.test(filePath) && !/\.d\.ts$/.test(filePath)) {
        return true;
      }

      return ignore.reduce((acc, pattern) => {
        return acc || !!filePath.match(pattern);
      }, false);
    });
    if (filesToRemove.length) {
      shell.rm('-f', ...filesToRemove);
    }
  }
}

function logError(type, packageJson, errorLogs) {
  log.error(`FAILED (${type}) : ${errorLogs}`);
  log.error(
    `FAILED to compile ${type}: ${chalk.bold(`${packageJson.name}@${packageJson.version}`)}`
  );
}

const modules = true;

async function prepare({ cwd, flags }) {
  const { packageJson } = await readPkgUp(cwd);
  const message = chalk.gray(`Built: ${chalk.bold(`${packageJson.name}@${packageJson.version}`)}`);
  console.time(message);

  if (flags.includes('--reset')) {
    await removeDist();
  }

  await Promise.all([
    babelify({
      modules,
      watch: flags.includes('--watch'),
      errorCallback: (errorLogs) => logError('js', packageJson, errorLogs),
    }),
    tscfy({
      watch: flags.includes('--watch'),
      errorCallback: (errorLogs) => logError('ts', packageJson, errorLogs),
    }),
  ]);

  await cleanup();
  console.timeEnd(message);
}

const flags = process.argv.slice(2);
const cwd = process.cwd();

prepare({ cwd, flags });
