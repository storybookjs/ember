import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import { logger } from '@storybook/node-logger';
import { Options, normalizeStories, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { autoTitle } from '@storybook/store';
import { readCsfOrMdx } from '@storybook/csf-tools';

interface ExtractedStory {
  title: string;
  name: string;
  importPath: string;
}

type ExtractedStories = Record<string, ExtractedStory>;

async function extractStories(normalizedStories: NormalizedStoriesSpecifier[], configDir: string) {
  const storiesGlobs = normalizedStories.map((s) => s.glob);
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
        const importPath = relativePath[0] === '.' ? relativePath : `./${relativePath}`;
        const defaultTitle = autoTitle(importPath, normalizedStories);
        const csf = (await readCsfOrMdx(absolutePath, { defaultTitle })).parse();
        csf.stories.forEach(({ id, name }) => {
          stories[id] = {
            title: csf.meta.title,
            name,
            importPath,
          };
        });
      } catch (err) {
        logger.warn(`🚨 Extraction error on ${relativePath}: ${err}`);
        logger.warn(`🚨 ${err.stack}`);
        throw err;
      }
    })
  );
  return stories;
}

export async function extractStoriesJson(
  outputFile: string,
  normalizedStories: NormalizedStoriesSpecifier[],
  configDir: string
) {
  const stories = await extractStories(normalizedStories, configDir);
  await fs.writeJson(outputFile, { v: 3, stories });
}

export async function useStoriesJson(router: any, options: Options) {
  const normalized = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });
  router.use('/stories.json', async (_req: any, res: any) => {
    extractStories(normalized, options.configDir)
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
