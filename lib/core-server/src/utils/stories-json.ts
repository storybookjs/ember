import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import { logger } from '@storybook/node-logger';
import { resolvePathInStorybookCache, Options } from '@storybook/core-common';
import { readCsf } from '@storybook/csf-tools';

interface ExtractedStory {
  id: string;
  kind: string;
  name: string;
  parameters: Record<string, any>;
}

type ExtractedStories = Record<string, ExtractedStory>;

export async function extractStoriesJson(
  ouputFile: string,
  storiesGlobs: string[],
  configDir: string
) {
  if (!storiesGlobs) {
    throw new Error('No stories glob');
  }
  const storyFiles: string[] = [];
  await Promise.all(
    storiesGlobs.map(async (storiesGlob) => {
      const files = await glob(path.join(configDir, storiesGlob));
      storyFiles.push(...files);
    })
  );
  logger.info(`⚙️ Processing ${storyFiles.length} story files from ${storiesGlobs}`);

  const stories: ExtractedStories = {};
  await Promise.all(
    storyFiles.map(async (fileName) => {
      const ext = path.extname(fileName);
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        logger.info(`skipping ${fileName}`);
      }
      const csf = (await readCsf(fileName)).parse();
      csf.stories.forEach((story) => {
        stories[story.id] = {
          ...story,
          kind: csf.meta.title,
          parameters: { ...story.parameters, fileName },
        };
      });
    })
  );
  await fs.writeJson(ouputFile, { v: 3, stories });
}

const timeout = 30000; // 30s
const step = 100; // .1s

export async function useStoriesJson(router: any, options: Options) {
  const storiesJson = resolvePathInStorybookCache('stories.json');
  await fs.remove(storiesJson);
  const storiesGlobs = (await options.presets.apply('stories')) as string[];
  extractStoriesJson(storiesJson, storiesGlobs, options.configDir);
  router.use('/stories.json', async (_req: any, res: any) => {
    for (let i = 0; i < timeout / step; i += 1) {
      if (fs.existsSync(storiesJson)) {
        // eslint-disable-next-line no-await-in-loop
        const json = await fs.readFile(storiesJson, 'utf-8');
        res.header('Content-Type', 'application/json');
        return res.send(json);
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r: any) => setTimeout(r, step));
    }
    return res.status(408).send('stories.json timeout');
  });
}
