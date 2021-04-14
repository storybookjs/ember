import fs from 'fs';
import prompts from 'prompts';
import { logger } from '@storybook/node-logger';

interface ReproOptions {
  outputDirectory: string;
  list?: boolean;
  template?: string;
}

const TEMPLATES: Record<string, any> = {
  cra: () => {},
  blank: () => {},
};

const FRAMEWORKS: Record<string, string[]> = {
  react: ['cra'],
  other: [],
};

export const repro = async ({ outputDirectory, list, template }: ReproOptions) => {
  if (list) {
    logger.info('Available templates');
    Object.entries(FRAMEWORKS).forEach(([framework, templates]) => {
      logger.info(framework);
      templates.forEach((t) => logger.info(`- ${t}`));
      if (framework === 'other') {
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
    if (fs.existsSync(selectedDirectory)) {
      throw new Error(`Repro: ${selectedDirectory} already exists`);
    }
  }

  let selectedTemplate = template;
  if (!selectedTemplate) {
    const { framework } = await prompts({
      type: 'select',
      message: 'Select the repro framework',
      name: 'framework',
      choices: Object.keys(FRAMEWORKS).map((f) => ({ title: f, value: f })),
    });

    selectedTemplate = (
      await prompts({
        type: 'select',
        message: 'Select the repro base template',
        name: 'template',
        choices: [...FRAMEWORKS[framework], 'blank'].map((f) => ({
          title: f,
          value: f,
        })),
      })
    ).template;
  }

  if (!TEMPLATES[selectedTemplate]) {
    throw new Error('Repro: please specify a valid template type');
  }
  logger.info(`Running ${selectedTemplate} into ${selectedDirectory}`);
};
