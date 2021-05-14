/* eslint-disable no-irregular-whitespace */
import path from 'path';
import { remove, ensureDir, pathExists } from 'fs-extra';
import prompts from 'prompts';
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

const runCypress = async ({ name }: Options, location: string) => {
  const cypressCommand = openCypressInUIMode ? 'open' : 'run';
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

  try {
    await runCypress(options, 'http://localhost:4000');
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
        const { cleanup } = await prompts({
          type: 'toggle',
          name: 'cleanup',
          message: 'Should perform cleanup?',
          initial: false,
          active: 'yes',
          inactive: 'no',
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

program
  .option('--clean', 'Clean up existing projects before running the tests', false)
  .option('--pnp', 'Run tests using Yarn 2 PnP instead of Yarn 1 + npx', false)
  .option(
    '--use-local-sb-cli',
    'Run tests using local @storybook/cli package (⚠️ Be sure @storybook/cli is properly built as it will not be rebuilt before running the tests)',
    false
  )
  .option(
    '--skip <value>',
    'Skip a framework, can be used multiple times "--skip angular@latest --skip preact"',
    (value, previous) => previous.concat([value]),
    []
  )
  .option('--all', `run e2e tests for every framework`, false);
program.parse(process.argv);

type ProgramOptions = {
  all?: boolean;
  pnp?: boolean;
  useLocalSbCli?: boolean;
  clean?: boolean;
  args?: string[];
  skip?: string[];
};

const {
  all: shouldRunAllFrameworks,
  args: frameworkArgs,
  skip: frameworksToSkip,
}: ProgramOptions = program;

let { pnp, useLocalSbCli, clean: startWithCleanSlate }: ProgramOptions = program;

const typedConfigs: { [key: string]: Parameters } = configs;
let e2eConfigs: { [key: string]: Parameters } = {};

let openCypressInUIMode = !process.env.CI;

const getConfig = async () => {
  if (shouldRunAllFrameworks) {
    logger.info(`📑 Running test for ALL frameworks`);
    Object.values(typedConfigs).forEach((config) => {
      e2eConfigs[`${config.name}-${config.version}`] = config;
    });

    // CRA Bench is a special case of E2E tests, it requires Node 12 as `@storybook/bench` is using `@hapi/hapi@19.2.0`
    // which itself need Node 12.
    delete e2eConfigs['cra_bench-latest'];
    return;
  }

  // Compute the list of frameworks we will run E2E for
  if (frameworkArgs.length > 0) {
    frameworkArgs.forEach((framework) => {
      e2eConfigs[framework] = Object.values(typedConfigs).find((c) => c.name === framework);
    });
  } else {
    const selectedValues = await prompts([
      {
        type: 'toggle',
        name: 'openCypressInUIMode',
        message: 'Open cypress in UI mode',
        initial: false,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'toggle',
        name: 'useLocalSbCli',
        message: 'Use local Storybook CLI',
        initial: false,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'autocompleteMultiselect',
        message: 'Select the frameworks to run',
        name: 'frameworks',
        hint:
          'You can also run directly with package name like `test:e2e-framework react`, or `yarn test:e2e-framework --all` for all packages!',
        choices: Object.keys(configs).map((key) => {
          // @ts-ignore
          const { name, version } = configs[key];
          return {
            // @ts-ignore
            value: configs[key],
            title: `${name}@${version}`,
            selected: false,
          };
        }),
      },
    ]);

    if (!selectedValues.frameworks) {
      logger.info(`No framework was selected.`);
      process.exit(process.exitCode || 0);
    }

    useLocalSbCli = selectedValues.useLocalSbCli;
    openCypressInUIMode = selectedValues.openCypressInUIMode;
    e2eConfigs = selectedValues.frameworks;
  }

  // Remove frameworks listed with `--skip` arg
  frameworksToSkip.forEach((framework) => {
    delete e2eConfigs[framework];
  });
};

const perform = async () => {
  await getConfig();
  const limit = pLimit(1);
  const narrowedConfigs = Object.values(e2eConfigs);

  const list = filterDataForCurrentCircleCINode(narrowedConfigs) as Parameters[];

  logger.info(`📑 Will run E2E tests for:${list.map((c) => `${c.name}`).join(', ')}`);

  return Promise.all(list.map((config) => limit(() => runE2E(config))));
};

perform().then(() => {
  process.exit(process.exitCode || 0);
});
