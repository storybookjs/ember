import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import { logger } from '@storybook/node-logger';
import { Options, normalizeStories } from '@storybook/core-common';
import { readCsfOrMdx } from '@storybook/csf-tools';

interface ExtractedStory {
  title: string;
  name: string;
  importPath: string;
}

type ExtractedStories = Record<string, ExtractedStory>;

async function extractStories(storiesGlobs: string[], configDir: string) {
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
    storyFiles.map(async (absolutePath) => {
      const ext = path.extname(absolutePath);
      const relativePath = path.relative(configDir, absolutePath);
      if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
        logger.info(`Skipping ${ext} file ${relativePath}`);
        return;
      }
      try {
        const csf = (await readCsfOrMdx(absolutePath)).parse();
        csf.stories.forEach(({ id, name }) => {
          stories[id] = {
            title: csf.meta.title,
            name,
            importPath: relativePath,
          };
        });
      } catch (err) {
        logger.error(`🚨 Extraction error on ${relativePath}`);
        throw err;
      }
    })
  );
  return stories;
}

export async function extractStoriesJson(
  outputFile: string,
  storiesGlobs: string[],
  configDir: string
) {
  const stories = await extractStories(storiesGlobs, configDir);
  await fs.writeJson(outputFile, { v: 3, stories });
}

export async function useStoriesJson(router: any, options: Options) {
  const normalized = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });
  const globs = normalized.map((s) => s.glob);
  router.use('/stories.json', async (_req: any, res: any) => {
    extractStories(globs, options.configDir)
      .then((stories: ExtractedStories) => {
        res.header('Content-Type', 'application/json');
        return res.send(
          JSON.stringify({
            v: 3,
            stories,
          })
        );
      })
      .catch((err: Error) => {
        res.status(500).send(err.message);
      });
  });
}
