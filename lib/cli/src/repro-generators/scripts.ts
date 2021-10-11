import path from 'path';
import { writeJSON } from 'fs-extra';
import shell, { ExecOptions } from 'shelljs';
import chalk from 'chalk';

const logger = console;

export interface Parameters {
  /** E2E configuration name */
  name: string;
  /** framework version */
  version: string;
  /** CLI to bootstrap the project */
  generator: string;
  /** Use storybook framework detection */
  autoDetect?: boolean;
  /** Pre-build hook */
  preBuildCommand?: string;
  /** When cli complains when folder already exists */
  ensureDir?: boolean;
  /** Dependencies to add before building Storybook */
  additionalDeps?: string[];
  /** Add typescript dependency and creates a tsconfig.json file */
  typescript?: boolean;
}

interface Configuration {
  e2e: boolean;
  pnp: boolean;
}

const useLocalSbCli = true;

export interface Options extends Parameters {
  appName: string;
  creationPath: string;
  cwd?: string;
  e2e: boolean;
  pnp: boolean;
}

export const exec = async (
  command: string,
  options: ExecOptions = {},
  { startMessage, errorMessage }: { startMessage?: string; errorMessage?: string } = {}
) => {
  if (startMessage) {
    logger.info(startMessage);
  }
  logger.debug(command);
  return new Promise((resolve, reject) => {
    const defaultOptions: ExecOptions = {
      silent: true,
    };
    shell.exec(command, { ...defaultOptions, ...options }, (code, stdout, stderr) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        logger.error(chalk.red(`An error occurred while executing: \`${command}\``));
        logger.error(`Command output was:${chalk.yellow(`\n${stdout}\n${stderr}`)}`);
        if (errorMessage) {
          logger.error(errorMessage);
        }
        reject(new Error(`command exited with code: ${code}: `));
      }
    });
  });
};

const installYarn2 = async ({ cwd, pnp }: Options) => {
  const command = [
    `yarn set version berry`,
    `yarn config set enableGlobalCache true`,
    `yarn config set nodeLinker ${pnp ? 'pnp' : 'node-modules'}`,
  ].join(' && ');

  await exec(
    command,
    { cwd },
    { startMessage: `🧶 Installing Yarn 2`, errorMessage: `🚨 Installing Yarn 2 failed` }
  );
};

const configureYarn2ForE2E = async ({ cwd }: Options) => {
  const command = [
    // ⚠️ Need to set registry because Yarn 2 is not using the conf of Yarn 1 (URL is hardcoded in CircleCI config.yml)
    `yarn config set npmScopes --json '{ "storybook": { "npmRegistryServer": "http://localhost:6000/" } }'`,
    // Some required magic to be able to fetch deps from local registry
    `yarn config set unsafeHttpWhitelist --json '["localhost"]'`,
    // Disable fallback mode to make sure everything is required correctly
    `yarn config set pnpFallbackMode none`,
    // We need to be able to update lockfile when bootstrapping the examples
    `yarn config set enableImmutableInstalls false`,
    // Discard all YN0013 - FETCH_NOT_CACHED messages
    `yarn config set logFilters --json '[ { "code": "YN0013", "level": "discard" } ]'`,
  ].join(' && ');

  await exec(
    command,
    { cwd },
    { startMessage: `🎛 Configuring Yarn 2`, errorMessage: `🚨 Configuring Yarn 2 failed` }
  );
};

const generate = async ({ cwd, name, appName, version, generator }: Options) => {
  const command = generator.replace(/{{appName}}/g, appName).replace(/{{version}}/g, version);

  await exec(
    command,
    { cwd },
    {
      startMessage: `🏗 Bootstrapping ${name} project (this might take a few minutes)`,
      errorMessage: `🚨 Bootstrapping ${name} failed`,
    }
  );
};

const initStorybook = async ({ cwd, autoDetect = true, name, e2e }: Options) => {
  const type = autoDetect ? '' : `--type ${name}`;
  const linkable = e2e ? '' : '--linkable';
  const sbCLICommand = useLocalSbCli
    ? `node ${path.join(__dirname, '../../esm/generate')}`
    : `yarn dlx -p @storybook/cli sb`;

  const command = `${sbCLICommand} init --yes ${type} ${linkable}`;

  await exec(
    command,
    { cwd },
    {
      startMessage: `🎨 Initializing Storybook with @storybook/cli`,
      errorMessage: `🚨 Storybook initialization failed`,
    }
  );
};

const addRequiredDeps = async ({ cwd, additionalDeps }: Options) => {
  // Remove any lockfile generated without Yarn 2
  shell.rm('-f', path.join(cwd, 'package-lock.json'), path.join(cwd, 'yarn.lock'));

  const command =
    additionalDeps && additionalDeps.length > 0
      ? `yarn add -D ${additionalDeps.join(' ')}`
      : `yarn install`;

  await exec(
    command,
    { cwd },
    {
      startMessage: `🌍 Adding needed deps & installing all deps`,
      errorMessage: `🚨 Dependencies installation failed`,
    }
  );
};

const addTypescript = async ({ cwd }: Options) => {
  logger.info(`👮 Adding typescript and tsconfig.json`);
  try {
    await exec(`yarn add -D typescript@latest`, { cwd });
    const tsConfig = {
      compilerOptions: {
        baseUrl: '.',
        esModuleInterop: true,
        jsx: 'preserve',
        skipLibCheck: true,
        strict: true,
      },
      include: ['src/*'],
    };
    const tsConfigJsonPath = path.resolve(cwd, 'tsconfig.json');
    await writeJSON(tsConfigJsonPath, tsConfig, { encoding: 'utf8', spaces: 2 });
  } catch (e) {
    logger.error(`🚨 Creating tsconfig.json failed`);
    throw e;
  }
};

const doTask = async (
  task: (options: Options) => Promise<void>,
  options: Options,
  condition = true
) => {
  if (condition) {
    await task(options);
    logger.log();
  }
};

export const createAndInit = async (
  cwd: string,
  { name, version, ...rest }: Parameters,
  { e2e, pnp }: Configuration
) => {
  const options: Options = {
    name,
    version,
    appName: path.basename(cwd),
    creationPath: path.join(cwd, '..'),
    cwd,
    e2e,
    pnp,
    ...rest,
  };

  logger.log();
  logger.info(`🏃 Starting for ${name} ${version}`);
  logger.log();
  logger.debug(options);
  logger.log();

  await doTask(generate, { ...options, cwd: options.creationPath });

  await doTask(installYarn2, options);

  await doTask(configureYarn2ForE2E, options, e2e);

  await doTask(addTypescript, options, !!options.typescript);
  await doTask(addRequiredDeps, options);
  await doTask(initStorybook, options);
};
