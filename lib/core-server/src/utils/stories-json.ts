import fs from 'fs-extra';
import { Options, normalizeStories, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { StoryIndexGenerator } from './StoryIndexGenerator';

export async function extractStoriesJson(
  outputFile: string,
  normalizedStories: NormalizedStoriesSpecifier[],
  configDir: string
) {
  const generator = new StoryIndexGenerator(normalizedStories, configDir);
  await generator.initialize();

  const index = await generator.getIndex();
  await fs.writeJson(outputFile, index);
}

export async function useStoriesJson(router: any, options: Options) {
  const normalized = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });

  router.use('/stories.json', async (_req: any, res: any) => {
    const generator = new StoryIndexGenerator(normalized, options.configDir);
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
