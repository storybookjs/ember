/* eslint-disable no-irregular-whitespace */
import path from 'path';
import { remove, ensureDir, pathExists } from 'fs-extra';
import { prompt } from 'enquirer';
import pLimit from 'p-limit';

import program from 'commander';
import { serve } from './utils/serve';
import { exec } from './utils/command';
// @ts-ignore
import { filterDataForCurrentCircleCINode } from './utils/concurrency';

import * as configs from '../lib/cli/src/repro-generators/configs';
import { Parameters } from '../lib/cli/src/repro-generators/configs';

const logger = console;

export interface Options {
  /** CLI repro template to use  */
  name: string;
  /** Pre-build hook */
  ensureDir?: boolean;
  cwd?: string;
}

const rootDir = path.join(__dirname, '..');
const siblingDir = path.join(__dirname, '..', '..', 'storybook-e2e-testing');

const prepareDirectory = async ({ cwd }: Options): Promise<boolean> => {
  const siblingExists = await pathExists(siblingDir);

  if (!siblingExists) {
    await ensureDir(siblingDir);
  }

  const cwdExists = await pathExists(cwd);

  if (cwdExists) {
    return true;
  }

  return false;
};

const cleanDirectory = async ({ cwd }: Options): Promise<void> => {
  await remove(cwd);
};

const buildStorybook = async ({ cwd }: Options) => {
  logger.info(`👷 Building Storybook`);
  try {
    await exec(`yarn build-storybook --quiet`, { cwd });
  } catch (e) {
    logger.error(`🚨 Storybook build failed`);
    throw e;
  }
};

const serveStorybook = async ({ cwd }: Options, port: string) => {
  const staticDirectory = path.join(cwd, 'storybook-static');
  logger.info(`🌍 Serving ${staticDirectory} on http://localhost:${port}`);

  return serve(staticDirectory, port);
};

const runCypress = async ({ name }: Options, location: string, open: boolean) => {
  const cypressCommand = open ? 'open' : 'run';
  logger.info(`🤖 Running Cypress tests`);
  try {
    await exec(
      `yarn cypress ${cypressCommand} --config pageLoadTimeout=4000,execTimeout=4000,taskTimeout=4000,responseTimeout=4000,integrationFolder="cypress/generated" --env location="${location}"`,
      { cwd: rootDir }
    );
    logger.info(`✅ E2E tests success`);
    logger.info(`🎉 Storybook is working great with ${name}!`);
  } catch (e) {
    logger.error(`🚨 E2E tests fails`);
    logger.info(`🥺 Storybook has some issues with ${name}!`);
    throw e;
  }
};

const runTests = async ({ name, ...rest }: Parameters) => {
  const options = {
    name,
    ...rest,
    cwd: path.join(siblingDir, `${name}`),
  };

  logger.log();
  logger.info(`🏃‍♀️ Starting for ${name}`);
  logger.log();
  logger.debug(options);
  logger.log();

  if (!(await prepareDirectory(options))) {
    // Call repro cli
    const sbCLICommand = useLocalSbCli
      ? 'node ../storybook/lib/cli/bin repro'
      : // Need to use npx because at this time we don't have Yarn 2 installed
        'npx -p @storybook/cli sb repro';

    const targetFolder = path.join(siblingDir, `${name}`);
    const commandArgs = [
      targetFolder,
      `--framework ${options.framework}`,
      `--template ${options.name}`,
      '--e2e',
    ];

    if (pnp) {
      commandArgs.push('--pnp');
    }

    const command = `${sbCLICommand} ${commandArgs.join(' ')}`;
    logger.debug(command);
    await exec(command, { cwd: siblingDir });

    await buildStorybook(options);
    logger.log();
  }

  const server = await serveStorybook(options, '4000');
  logger.log();

  let open = false;
  if (!process.env.CI) {
    ({ open } = await prompt({
      type: 'confirm',
      name: 'open',
      message: 'Should open cypress?',
    }));
  }

  try {
    await runCypress(options, 'http://localhost:4000', open);
    logger.log();
  } finally {
    server.close();
  }
};

// Run tests!
const runE2E = async (parameters: Parameters) => {
  const { name } = parameters;
  const cwd = path.join(siblingDir, `${name}`);
  if (startWithCleanSlate) {
    logger.log();
    logger.info(`♻️  Starting with a clean slate, removing existing ${name} folder`);
    await cleanDirectory({ ...parameters, cwd });
  }

  return runTests(parameters)
    .then(async () => {
      if (!process.env.CI) {
        const { cleanup } = await prompt<{ cleanup: boolean }>({
          type: 'confirm',
          name: 'cleanup',
          message: 'Should perform cleanup?',
        });

        if (cleanup) {
          logger.log();
          logger.info(`🗑  Cleaning ${cwd}`);
          await cleanDirectory({ ...parameters, cwd });
        } else {
          logger.log();
          logger.info(`🚯 No cleanup happened: ${cwd}`);
        }
      }
    })
    .catch((e) => {
      logger.error(`🛑 an error occurred:\n${e}`);
      logger.log();
      logger.error(e);
      logger.log();
      process.exitCode = 1;
    });
};

program.option('--clean', 'Clean up existing projects before running the tests', false);
program.option('--pnp', 'Run tests using Yarn 2 PnP instead of Yarn 1 + npx', false);
program.option(
  '--use-local-sb-cli',
  'Run tests using local @storybook/cli package (⚠️ Be sure @storybook/cli is properly build as it will not be rebuild before running the tests)',
  false
);
program.option(
  '--skip <value>',
  'Skip a framework, can be used multiple times "--skip angular@latest --skip preact"',
  (value, previous) => previous.concat([value]),
  []
);
program.parse(process.argv);

const {
  pnp,
  useLocalSbCli,
  clean: startWithCleanSlate,
  args: frameworkArgs,
  skip: frameworksToSkip,
}: {
  pnp?: boolean;
  useLocalSbCli?: boolean;
  clean?: boolean;
  args?: string[];
  skip?: string[];
} = program;

const typedConfigs: { [key: string]: Parameters } = configs;
const e2eConfigs: { [key: string]: Parameters } = {};

// Compute the list of frameworks we will run E2E for
if (frameworkArgs.length > 0) {
  frameworkArgs.forEach((framework) => {
    e2eConfigs[framework] = Object.values(typedConfigs).find((c) => c.name === framework);
  });
} else {
  Object.values(typedConfigs).forEach((config) => {
    e2eConfigs[config.name] = config;
  });
}

// Remove frameworks listed with `--skip` arg
frameworksToSkip.forEach((framework) => {
  delete e2eConfigs[framework];
});

const perform = () => {
  const limit = pLimit(1);
  const narrowedConfigs = Object.values(e2eConfigs);

  const list = filterDataForCurrentCircleCINode(narrowedConfigs) as Parameters[];

  logger.info(`📑 Will run E2E tests for:${list.map((c) => `${c.name}`).join(', ')}`);

  return Promise.all(list.map((config) => limit(() => runE2E(config))));
};

perform().then(() => {
  process.exit(process.exitCode || 0);
});
