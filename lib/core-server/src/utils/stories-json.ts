import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import { logger } from '@storybook/node-logger';
import { Options } from '@storybook/core-common';
import { readCsf } from '@storybook/csf-tools';

interface ExtractedStory {
  id: string;
  kind: string;
  name: string;
}

type ExtractedStories = Record<string, ExtractedStory>;

export async function extractStoriesJson(fileName: string, storiesGlobs: string[]) {
  if (!storiesGlobs) {
    throw new Error('No stories glob');
  }
  const storyFiles: string[] = [];
  await Promise.all(
    storiesGlobs.map(async (storiesGlob) => {
      const files = await glob(storiesGlob);
      storyFiles.push(...files);
    })
  );
  logger.info(`⚙️ Processing ${storyFiles.length} story files`);

  const stories: ExtractedStories = {};
  await Promise.all(
    storyFiles.map(async (csfFile) => {
      const ext = path.extname(csfFile);
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        logger.info(`skipping ${csfFile}`);
      }
      const csf = (await readCsf(csfFile)).parse();
      csf.stories.forEach((story) => {
        stories[story.id] = { ...story, kind: csf.meta.title };
      });
    })
  );
  await fs.writeJson(fileName, { v: 3, stories });
}

// const timeout = 30000; // 30s
// const step = 100; // .1s

// export async function useStoriesJson(router: any, options: Options) {
//   const storiesFile = '/tmp/stories.json';
//   await fs.remove(storiesFile);
//   const storiesGlobs = (await options.presets.apply('stories')) as string[];
//   extractStoriesJson(storiesFile, storiesGlobs);
//   router.use('/stories.json', async (_req: any, res: any) => {
//     for (let i = 0; i < timeout / step; i += 1) {
//       if (fs.existsSync(storiesFile)) {
//         // eslint-disable-next-line no-await-in-loop
//         return res.json(await fs.readFile(storiesFile, 'utf-8'));
//       }
//       // eslint-disable-next-line no-await-in-loop
//       await new Promise((r: any) => setTimeout(r, step));
//     }
//     res.status(408).send('stories.json timeout');
//   });
// }
