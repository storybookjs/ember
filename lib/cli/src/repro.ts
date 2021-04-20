import prompts from 'prompts';
import { logger } from '@storybook/node-logger';
import path from 'path';
import { createAndInit, Parameters } from './repro-generators/scripts';
import * as configs from './repro-generators/configs';
import { SupportedFrameworks } from './project_types';

interface ReproOptions {
  outputDirectory: string;
  framework?: SupportedFrameworks;
  list?: boolean;
  template?: string;
  e2e?: boolean;
}

const FRAMEWORKS = Object.values(configs).reduce<Record<SupportedFrameworks, Parameters[]>>(
  (acc, cur) => {
    acc[cur.framework] = [...(acc[cur.framework] || []), cur];
    return acc;
  },
  {} as Record<SupportedFrameworks, Parameters[]>
);

export const repro = async ({ outputDirectory, list, template, framework, e2e }: ReproOptions) => {
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
  if (!selectedFramework) {
    const { framework: frameworkOpt } = await prompts({
      type: 'select',
      message: 'Select the repro framework',
      name: 'framework',
      choices: Object.keys(FRAMEWORKS).map((f) => ({ title: f, value: f })),
    });
    selectedFramework = frameworkOpt;
  }
  if (!selectedTemplate) {
    selectedTemplate = (
      await prompts({
        type: 'select',
        message: 'Select the repro base template',
        name: 'template',
        choices: FRAMEWORKS[framework as SupportedFrameworks].map((f) => ({
          title: f.name,
          value: f.name,
        })),
      })
    ).template;
  }

  const selectedConfig = FRAMEWORKS[framework as SupportedFrameworks].find(
    (t) => t.name === selectedTemplate
  );

  if (!selectedConfig) {
    throw new Error('Repro: please specify a valid template type');
  }
  logger.info(`Running ${selectedTemplate} into ${path.join(process.cwd(), selectedDirectory)}`);

  try {
    await createAndInit(path.join(process.cwd(), selectedDirectory), selectedConfig, {
      installer: e2e ? 'yarn dlx' : 'npx',
    });
  } catch (error) {
    logger.error('Failed to create repro');
  }
};
