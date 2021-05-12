import fse from 'fs-extra';
import path from 'path';
import { logger } from '@storybook/node-logger';
import { exec } from './repro-generators/scripts';

interface LinkOptions {
  reproUrl: string;
}

export const link = async ({ reproUrl }: LinkOptions) => {
  const storybookDirectory = process.cwd();
  try {
    const packageJson = JSON.parse(fse.readFileSync('package.json', 'utf8'));
    if (packageJson.name !== '@storybook/root') throw new Error();
  } catch {
    throw new Error('Expected to run link from the root of the storybook monorepo');
  }

  const reprosDirectory = path.join(storybookDirectory, '../storybook-repros');
  logger.info(`Ensuring directory ${reprosDirectory}`);
  fse.ensureDirSync(reprosDirectory);

  logger.info(`Cloning ${reproUrl}`);
  await exec(`git clone ${reproUrl}`, { cwd: reprosDirectory });
  // Extract a repro name from url given as input (take the last part of the path and remove the extension)
  const reproName = path.basename(reproUrl, path.extname(reproUrl));
  const repro = path.join(reprosDirectory, reproName);

  logger.info(`Linking ${repro}`);
  await exec(`yarn link --all ${storybookDirectory}`, { cwd: repro });

  logger.info(`Installing ${reproName}`);
  await exec(`yarn install`, { cwd: repro });

  // ⚠️ TODO: Fix peer deps in `@storybook/preset-create-react-app`
  logger.info(
    `Magic stuff related to @storybook/preset-create-react-app, we need to fix peerDependencies`
  );
  await exec(`yarn add -D webpack-hot-middleware`, { cwd: repro });

  logger.info(`Running ${reproName} storybook`);
  await exec(`yarn run storybook`, { cwd: repro });
};
