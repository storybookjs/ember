import fs from 'fs-extra';
import {
  Options,
  normalizeStories,
  NormalizedStoriesSpecifier,
  StorybookConfig,
} from '@storybook/core-common';
import { StoryIndexGenerator } from './StoryIndexGenerator';

export async function extractStoriesJson(
  outputFile: string,
  normalizedStories: NormalizedStoriesSpecifier[],
  configDir: string,
  v2compatibility: boolean
) {
  const generator = new StoryIndexGenerator(normalizedStories, configDir, v2compatibility);
  await generator.initialize();

  const index = await generator.getIndex();
  await fs.writeJson(outputFile, index);
}

export async function useStoriesJson(router: any, options: Options) {
  const normalized = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });

  const features = await options.presets.apply<StorybookConfig['features']>('features');

  router.use('/stories.json', async (_req: any, res: any) => {
    const generator = new StoryIndexGenerator(
      normalized,
      options.configDir,
      !features?.breakingChangesV7 && !features?.storyStoreV7
    );
    await generator.initialize();

    try {
      const index = await generator.getIndex();
      res.header('Content-Type', 'application/json');
      return res.send(JSON.stringify(index));
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });
}
