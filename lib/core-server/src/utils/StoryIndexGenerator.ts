import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';

import { autoTitle, sortStories, Path, StoryIndex, StoryIndexEntry } from '@storybook/store';
import { NormalizedStoriesSpecifier } from '@storybook/core-common';
import { logger } from '@storybook/node-logger';
import { readCsfOrMdx, getStorySortParameter } from '@storybook/csf-tools';

export class StoryIndexGenerator {
  // An internal cache mapping specifiers to a set of path=><set of stories>
  // Later, we'll combine each of these subsets together to form the full index
  private storyIndexEntries: Map<NormalizedStoriesSpecifier, Record<Path, StoryIndex['stories']>>;

  constructor(
    public readonly specifiers: NormalizedStoriesSpecifier[],
    public readonly configDir: Path
  ) {
    this.storyIndexEntries = new Map();
  }

  async initialize() {
    // Find all matching paths for each specifier
    await Promise.all(
      this.specifiers.map(async (specifier) => {
        const pathToSubIndex = {} as Record<Path, StoryIndex['stories']>;

        const files = await glob(path.join(this.configDir, specifier.glob));
        files.forEach((fileName: Path) => {
          pathToSubIndex[fileName] = {};
        });

        this.storyIndexEntries.set(specifier, pathToSubIndex);
      })
    );

    // Extract stories for each file
    await this.ensureExtracted();
  }

  async ensureExtracted() {
    await Promise.all(
      this.specifiers.map(async (specifier) => {
        const entry = this.storyIndexEntries.get(specifier);
        await Promise.all(
          Object.keys(entry).map(async (fileName) => {
            if (!entry[fileName]) this.extractStories(specifier, fileName);
          })
        );
      })
    );
  }

  async extractStories(specifier: NormalizedStoriesSpecifier, absolutePath: Path) {
    const ext = path.extname(absolutePath);
    const relativePath = path.relative(this.configDir, absolutePath);
    if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
      logger.info(`Skipping ${ext} file ${relativePath}`);
      return;
    }
    try {
      const stories = this.storyIndexEntries.get(specifier)[absolutePath];

      const importPath = relativePath[0] === '.' ? relativePath : `./${relativePath}`;
      const defaultTitle = autoTitle(importPath, [specifier]);
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
  }

  async getIndex() {
    // Extract any entries that are currently missing
    await this.ensureExtracted();

    const stories: StoryIndex['stories'] = {};

    // Check each entry and compose into stories, extracting if needed
    this.specifiers.map(async (specifier) => {
      Object.values(this.storyIndexEntries.get(specifier)).map((subStories) =>
        Object.assign(stories, subStories)
      );
    });

    const storySortParameter = await this.getStorySortParameter();
    // TODO: Sort the stories

    return {
      v: 3,
      stories,
    };
  }

  async getStorySortParameter() {
    const previewFile = ['js', 'jsx', 'ts', 'tsx']
      .map((ext) => path.join(this.configDir, `preview.${ext}`))
      .find((fname) => fs.existsSync(fname));
    let storySortParameter;
    if (previewFile) {
      const previewCode = (await fs.readFile(previewFile, 'utf-8')).toString();
      storySortParameter = await getStorySortParameter(previewCode);
    }

    return storySortParameter;
  }
}
