import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import { logger } from '@storybook/node-logger';
import { Options, normalizeStories, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { autoTitle, sortStories } from '@storybook/store';
import { readCsfOrMdx, getStorySortParameter } from '@storybook/csf-tools';

interface ExtractedStory {
  title: string;
  name: string;
  importPath: string;
}

type ExtractedStories = Record<string, ExtractedStory>;

function sortExtractedStories(
  stories: ExtractedStories,
  storySortParameter: any,
  fileNameOrder: string[]
) {
  const sortableStories = Object.entries(stories).map(([id, story]) => [
    id,
    { id, kind: story.title, story: story.name, ...story },
    { fileName: story.importPath },
  ]);
  sortStories(sortableStories, storySortParameter, fileNameOrder);
  return sortableStories.reduce((acc, item) => {
    const storyId = item[0] as string;
    acc[storyId] = stories[storyId];
    return acc;
  }, {} as ExtractedStories);
}

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

  const previewFile = ['js', 'jsx', 'ts', 'tsx']
    .map((ext) => path.join(configDir, `preview.${ext}`))
    .find((fname) => fs.existsSync(fname));

  let storySortParameter;
  if (previewFile) {
    const previewCode = (await fs.readFile(previewFile, 'utf-8')).toString();
    storySortParameter = await getStorySortParameter(previewCode);
  }

  const sorted = sortExtractedStories(stories, storySortParameter, storyFiles);

  return sorted;
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
