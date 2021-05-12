import prompts from 'prompts';
import { logger } from '@storybook/node-logger';
import path from 'path';
import { createAndInit, Parameters, exec } from './repro-generators/scripts';
import * as configs from './repro-generators/configs';
import { SupportedFrameworks } from './project_types';

interface ReproOptions {
  outputDirectory: string;
  framework?: SupportedFrameworks;
  list?: boolean;
  template?: string;
  e2e?: boolean;
  generator?: string;
  pnp?: boolean;
}

const TEMPLATES = configs as Record<string, Parameters>;

const FRAMEWORKS = Object.values(configs).reduce<Record<SupportedFrameworks, Parameters[]>>(
  (acc, cur) => {
    acc[cur.framework] = [...(acc[cur.framework] || []), cur];
    return acc;
  },
  {} as Record<SupportedFrameworks, Parameters[]>
);

export const repro = async ({
  outputDirectory,
  list,
  template,
  framework,
  generator,
  e2e,
  pnp,
}: ReproOptions) => {
  if (list) {
    logger.info('Available templates');
    Object.entries(FRAMEWORKS).forEach(([fmwrk, templates]) => {
      logger.info(fmwrk);
      templates.forEach((t) => logger.info(`- ${t.name}`));
      if (fmwrk === 'other') {
        logger.info('- blank');
      }
    });
    return;
  }

  let selectedDirectory = outputDirectory;
  if (!selectedDirectory) {
    const { directory } = await prompts({
      type: 'text',
      message: 'Enter the output directory',
      name: 'directory',
    });
    selectedDirectory = directory;
    // if (fs.existsSync(selectedDirectory)) {
    //   throw new Error(`Repro: ${selectedDirectory} already exists`);
    // }
  }

  let selectedTemplate = template;
  let selectedFramework = framework;
  if (!selectedTemplate && !generator) {
    if (!selectedFramework) {
      const { framework: frameworkOpt } = await prompts({
        type: 'select',
        message: 'Select the repro framework',
        name: 'framework',
        choices: Object.keys(FRAMEWORKS).map((f) => ({ title: f, value: f })),
      });
      selectedFramework = frameworkOpt;
    }
    selectedTemplate = (
      await prompts({
        type: 'select',
        message: 'Select the repro base template',
        name: 'template',
        choices: FRAMEWORKS[selectedFramework as SupportedFrameworks].map((f) => ({
          title: f.name,
          value: f.name,
        })),
      })
    ).template;
  }

  const selectedConfig = !generator
    ? TEMPLATES[selectedTemplate]
    : {
        name: 'custom',
        version: 'custom',
        generator,
      };

  if (!selectedConfig) {
    throw new Error('Repro: please specify a valid template type');
  }

  try {
    const cwd = path.isAbsolute(selectedDirectory)
      ? selectedDirectory
      : path.join(process.cwd(), selectedDirectory);

    logger.info(`Running ${selectedTemplate} into ${cwd}`);

    await createAndInit(cwd, selectedConfig, {
      e2e: !!e2e,
      pnp: !!pnp,
    });

    if (!e2e) {
      await initGitRepo(cwd);
    }
  } catch (error) {
    logger.error('Failed to create repro');
  }
};

const initGitRepo = async (cwd: string) => {
  await exec('git init', { cwd });
  await exec('echo "node_modules" >> .gitignore', { cwd });
  await exec('git add --all', { cwd });
  await exec('git commit -am "added storybook"', { cwd });
  await exec('git tag repro-base', { cwd });
};
