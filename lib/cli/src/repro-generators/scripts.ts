/* eslint-disable no-irregular-whitespace */
import path from 'path';
import { writeJSON } from 'fs-extra';
import shell, { ExecOptions } from 'shelljs';

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

export const exec = async (command: string, options: ExecOptions = {}) =>
  new Promise((resolve, reject) => {
    shell.exec(command, options, (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`command exited with code: ${code}`));
      }
    });
  });

const installYarn2 = async ({ cwd, pnp }: Options) => {
  const commands = [
    `yarn set version berry`,
    `yarn config set enableGlobalCache true`,
    `yarn config set nodeLinker ${pnp ? 'pnp' : 'node-modules'}`,
  ];

  const command = commands.join(' && ');

  logger.info(`🧶 Installing Yarn 2`);
  logger.debug(command);

  try {
    await exec(command, { cwd });
  } catch (e) {
    logger.error(`🚨 Installing Yarn 2 failed`);
    throw e;
  }
};

const configureYarn2ForE2E = async ({ cwd }: Options) => {
  const commands = [
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
  ];

  const command = commands.join(' && ');
  logger.info(`🎛 Configuring Yarn 2`);
  logger.debug(command);

  try {
    await exec(command, { cwd });
  } catch (e) {
    logger.error(`🚨 Configuring Yarn 2 failed`);
    throw e;
  }
};

const generate = async ({ cwd, name, appName, version, generator }: Options) => {
  const command = generator.replace(/{{appName}}/g, appName).replace(/{{version}}/g, version);

  logger.info(`🏗  Bootstrapping ${name} project`);
  logger.debug(command);

  try {
    await exec(command, { cwd });
  } catch (e) {
    logger.error(`🚨 Bootstrapping ${name} failed`);
    throw e;
  }
};

const initStorybook = async ({ cwd, autoDetect = true, name, e2e }: Options) => {
  logger.info(`🎨 Initializing Storybook with @storybook/cli`);
  try {
    const type = autoDetect ? '' : `--type ${name}`;
    const linkable = e2e ? '' : '--linkable';
    const sbCLICommand = useLocalSbCli
      ? `node ${path.join(__dirname, '../../esm/generate')}`
      : `yarn dlx -p @storybook/cli sb`;

    await exec(`${sbCLICommand} init --yes ${type} ${linkable}`, { cwd });
  } catch (e) {
    logger.error(`🚨 Storybook initialization failed`);
    throw e;
  }
};

const addRequiredDeps = async ({ cwd, additionalDeps }: Options) => {
  logger.info(`🌍 Adding needed deps & installing all deps`);
  try {
    // Remove any lockfile generated without Yarn 2
    shell.rm(path.join(cwd, 'package-lock.json'), path.join(cwd, 'yarn.lock'));
    if (additionalDeps && additionalDeps.length > 0) {
      await exec(`yarn add -D ${additionalDeps.join(' ')}`, {
        cwd,
      });
    } else {
      await exec(`yarn install`, {
        cwd,
      });
    }
  } catch (e) {
    logger.error(`🚨 Dependencies installation failed`);
    throw e;
  }
};

const addTypescript = async ({ cwd }: Options) => {
  logger.info(`👮🏻 Adding typescript and tsconfig.json`);
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
    logger.error(`🚨 Creating tsconfig.json failed`);
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
  logger.info(`🏃‍♀️ Starting for ${name} ${version}`);
  logger.log();
  logger.debug(options);
  logger.log();

  console.log({ creationPath: options.creationPath });

  await doTask(generate, { ...options, cwd: options.creationPath });

  await doTask(installYarn2, options);

  if (e2e) {
    await doTask(configureYarn2ForE2E, options);
  }

  await doTask(addTypescript, options, !!options.typescript);
  await doTask(addRequiredDeps, options);
  await doTask(initStorybook, options);
};
