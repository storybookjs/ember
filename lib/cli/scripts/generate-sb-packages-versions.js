#!/usr/bin/env node

const { writeJson, readJson } = require('fs-extra');
const path = require('path');
const globby = require('globby');
const semver = require('@storybook/semver');

const rootDirectory = path.join(__dirname, '..', '..', '..');

const logger = console;

const run = async () => {
  const updatedVersion = process.argv[process.argv.length - 1];

  if (!semver.valid(updatedVersion)) throw new Error(`Invalid version: ${updatedVersion}`);

  const storybookPackagesPaths = await globby(
    `${rootDirectory}/@(app|addons|lib)/**/package.json`,
    {
      ignore: '**/node_modules/**/*',
    }
  );

  const packageToVersionMap = (
    await Promise.all(
      storybookPackagesPaths.map(async (storybookPackagePath) => {
        const { name, version } = await readJson(storybookPackagePath);

        return {
          name,
          version,
        };
      })
    )
  )
    // Remove non-`@storybook/XXX` package (like: `cli-sb`, `cli-storybook`)
    .filter(({ name }) => /@storybook/.test(name))
    // As some previous steps are asynchronous order is not always the same so sort them to avoid that
    .sort((package1, package2) => package1.name.localeCompare(package2.name))
    .reduce((acc, { name }) => ({ ...acc, [name]: updatedVersion }), {});

  await writeJson(path.join(__dirname, '..', 'src', 'versions.json'), packageToVersionMap, {
    spaces: 2,
  });
};

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
