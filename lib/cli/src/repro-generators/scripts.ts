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

const useYarn2Pnp = false;
const useLocalSbCli = true;

export interface Options extends Parameters {
  appName: string;
  installer: 'npx' | 'yarn dlx';
  creationPath: string;
  cwd?: string;
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

const prepareDirectory = async (_: Options): Promise<boolean> => {
  return false;
  // const siblingExists = await pathExists(creationPath);

  // if (!siblingExists) {
  //   await ensureDir(creationPath);
  // }

  // await exec('git init', { cwd: creationPath });
  // await exec('npm init -y', { cwd: creationPath });
  // await writeFile(path.join(creationPath, '.gitignore'), 'node_modules\n');

  // const cwdExists = await pathExists(cwd);

  // if (cwdExists) {
  //   return true;
  // }

  // if (ensureDirOption) {
  //   await ensureDir(cwd);
  // }

  // return false;
};

// const cleanDirectory = async ({ cwd, creationPath }: Options): Promise<void> => {
//   await remove(cwd);
//   await remove(path.join(creationPath, 'node_modules'));
//   await remove(path.join(creationPath, 'package.json'));
//   await remove(path.join(creationPath, 'yarn.lock'));
//   await remove(path.join(creationPath, '.yarnrc.yml'));
//   await remove(path.join(creationPath, '.yarn'));
// };

const installYarn2 = async ({ cwd }: Options) => {
  const commands = [`yarn set version berry`, `yarn config set enableGlobalCache true`];

  if (!useYarn2Pnp) {
    commands.push('yarn config set nodeLinker node-modules');
  }

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

const configureYarn2 = async ({ cwd }: Options) => {
  const commands = [
    // Create file to ensure yarn will be ok to set some config in the current directory and not in the parent
    `touch yarn.lock`,
    // ⚠️ Need to set registry because Yarn 2 is not using the conf of Yarn 1
    // `yarn config set npmScopes --json '{ "storybook": { "npmRegistryServer": "http://localhost:6000/" } }'`,
    // // Some required magic to be able to fetch deps from local registry
    // `yarn config set unsafeHttpWhitelist --json '["localhost"]'`,
    // // Disable fallback mode to make sure everything is required correctly
    // `yarn config set pnpFallbackMode none`,
    // `yarn config set enableGlobalCache true`,
    // // We need to be able to update lockfile when bootstrapping the examples
    // `yarn config set enableImmutableInstalls false`,
    // // Add package extensions
    // // https://github.com/facebook/create-react-app/pull/9872
    // `yarn config set "packageExtensions.react-scripts@*.peerDependencies.react" "*"`,
    // `yarn config set "packageExtensions.react-scripts@*.dependencies.@pmmmwh/react-refresh-webpack-plugin" "*"`,
  ];

  if (!useYarn2Pnp) {
    commands.push('yarn config set nodeLinker node-modules');
  }

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

const generate = async ({ cwd, name, version, generator, installer, appName }: Options) => {
  const command = generator
    .replace(/{{appName}}/g, appName)
    .replace(/{{version}}/g, version)
    .replace(/{{installer}}/, installer);

  logger.info(`🏗  Bootstrapping ${name} project`);
  logger.debug(command);

  try {
    await exec(command, { cwd });
  } catch (e) {
    logger.error(`🚨 Bootstrapping ${name} failed`);
    throw e;
  }
};

const initStorybook = async ({ cwd, autoDetect = true, name, installer }: Options) => {
  logger.info(`🎨 Initializing Storybook with @storybook/cli`);
  try {
    const type = autoDetect ? '' : `--type ${name}`;
    const sbCLICommand = useLocalSbCli
      ? `node ${path.join(__dirname, '../../esm/generate')}`
      : `${installer} -p @storybook/cli sb`;

    await exec(`${sbCLICommand} init --yes ${type}`, { cwd });
  } catch (e) {
    logger.error(`🚨 Storybook initialization failed`);
    throw e;
  }
};

const addRequiredDeps = async ({ cwd, additionalDeps }: Options) => {
  logger.info(`🌍 Adding needed deps & installing all deps`);
  try {
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
  { name, version, ensureDir: ensureDirOption = true, ...rest }: Parameters
) => {
  const options = {
    name,
    version,
    ensureDir: ensureDirOption,
    appName: path.basename(cwd),
    creationPath: ensureDirOption ? path.join(cwd, '..') : cwd,
    installer: useYarn2Pnp ? (`yarn dlx` as const) : ('npx' as const),
    cwd,
    ...rest,
  };

  logger.log();
  logger.info(`🏃‍♀️ Starting for ${name} ${version}`);
  logger.log();
  logger.debug(options);
  logger.log();

  await doTask(
    installYarn2,
    { ...options, cwd: options.creationPath },
    options.installer === 'yarn dlx'
  );
  await doTask(generate, { ...options, cwd: options.creationPath });
  await doTask(configureYarn2, options, options.installer === 'yarn dlx');
  await doTask(addTypescript, options, options.typescript);
  await doTask(addRequiredDeps, options);
  await doTask(initStorybook, options);
};
