import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import dedent from 'ts-dedent';
import { createAndInit, exec } from './repro-generators/scripts';
import * as configs from './repro-generators/configs';
import type { Parameters } from './repro-generators/configs';
import { SupportedFrameworks } from './project_types';

const logger = console;

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

// Create a curate list of template because some of them only make sense in E2E
// context, fon instance react_in_yarn_workspace
const CURATED_TEMPLATES = Object.fromEntries(
  Object.entries(configs).filter((entry) => entry[0] !== 'react_in_yarn_workspace')
) as Record<string, Parameters>;

const FRAMEWORKS = Object.values(CURATED_TEMPLATES).reduce<
  Record<SupportedFrameworks, Parameters[]>
>((acc, cur) => {
  acc[cur.framework] = [...(acc[cur.framework] || []), cur];
  return acc;
}, {} as Record<SupportedFrameworks, Parameters[]>);

export const repro = async ({
  outputDirectory,
  list,
  template,
  framework,
  generator,
  e2e,
  pnp,
}: ReproOptions) => {
  logger.info(
    boxen(
      dedent`
        🤗 Welcome to ${chalk.yellow('sb repro')}! 🤗 

        Create a ${chalk.green('new project')} to minimally reproduce Storybook issues.
        
        1. select an environment that most closely matches your project setup.
        2. select a location for the reproduction, outside of your project.
        
        After the reproduction is ready, we'll guide you through the next steps.
        `.trim(),
      { borderStyle: 'round', padding: 1, borderColor: '#F1618C' } as any
    )
  );
  if (list) {
    logger.info('🌈 Available templates');
    Object.entries(FRAMEWORKS).forEach(([fmwrk, templates]) => {
      logger.info(fmwrk);
      templates.forEach((t) => logger.info(`- ${t.name}`));
      if (fmwrk === 'other') {
        logger.info('- blank');
      }
    });
    return;
  }

  let selectedTemplate = template;
  let selectedFramework = framework;
  if (!selectedTemplate && !generator) {
    if (!selectedFramework) {
      const { framework: frameworkOpt } = await prompts({
        type: 'select',
        message: '🌈 Select the repro framework',
        name: 'framework',
        choices: Object.keys(FRAMEWORKS).map((f) => ({ title: f, value: f })),
      });
      selectedFramework = frameworkOpt;
    }
    if (!selectedFramework) {
      throw new Error('🚨 Repro: please select a framework!');
    }
    selectedTemplate = (
      await prompts({
        type: 'select',
        message: '📝 Select the repro base template',
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
    throw new Error('🚨 Repro: please specify a valid template type');
  }

  let selectedDirectory = outputDirectory;
  if (!selectedDirectory) {
    const { directory } = await prompts({
      type: 'text',
      message: 'Enter the output directory',
      name: 'directory',
      initial: selectedConfig.name,
      validate: (directoryName) =>
        fs.existsSync(directoryName)
          ? `${directoryName} already exists. Please choose another name.`
          : true,
    });
    selectedDirectory = directory;
  }

  try {
    const cwd = path.isAbsolute(selectedDirectory)
      ? selectedDirectory
      : path.join(process.cwd(), selectedDirectory);

    logger.info(`🏃 Running ${selectedTemplate} into ${cwd}`);

    await createAndInit(cwd, selectedConfig, {
      e2e: !!e2e,
      pnp: !!pnp,
    });

    if (!e2e) {
      await initGitRepo(cwd);
    }

    logger.info(
      boxen(
        dedent`
        🎉 Your Storybook reproduction project is ready to use! 🎉

        ${chalk.yellow(`cd ${selectedDirectory}`)}
        ${chalk.yellow(`yarn storybook`)}

        Once you've recreated the problem you're experiencing, please:
        
        1. Document any additional steps in ${chalk.cyan('README.md')}
        2. Publish the repository to github
        3. Link to the repro repository in your issue

        Having a clean repro helps us solve your issue faster! 🙏
      `.trim(),
        { borderStyle: 'round', padding: 1, borderColor: '#F1618C' } as any
      )
    );
  } catch (error) {
    logger.error('🚨 Failed to create repro');
  }
};

const initGitRepo = async (cwd: string) => {
  await exec('git init', { cwd });
  await exec('echo "node_modules" >> .gitignore', { cwd });
  await exec('git add --all', { cwd });
  await exec('git commit -am "added storybook"', { cwd });
  await exec('git tag repro-base', { cwd });
};
