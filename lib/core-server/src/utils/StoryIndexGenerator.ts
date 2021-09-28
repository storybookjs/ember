import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';

import { autoTitleFromSpecifier, sortStories, Path, StoryIndex } from '@storybook/store';
import { NormalizedStoriesSpecifier } from '@storybook/core-common';
import { logger } from '@storybook/node-logger';
import { readCsfOrMdx, getStorySortParameter } from '@storybook/csf-tools';

function sortExtractedStories(
  stories: StoryIndex['stories'],
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
  }, {} as StoryIndex['stories']);
}

type SpecifierStoriesCache = Record<Path, StoryIndex['stories'] | false>;

export class StoryIndexGenerator {
  // An internal cache mapping specifiers to a set of path=><set of stories>
  // Later, we'll combine each of these subsets together to form the full index
  private storyIndexEntries: Map<NormalizedStoriesSpecifier, SpecifierStoriesCache>;

  // Cache the last value of `getStoryIndex`. We invalidate (by unsetting) when:
  //  - any file changes, including deletions
  //  - the preview changes [not yet implemented]
  private lastIndex?: StoryIndex;

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
        const pathToSubIndex = {} as SpecifierStoriesCache;

        const files = await glob(path.join(this.configDir, specifier.glob));
        console.log('specifiers');
        console.log(path.join(this.configDir, specifier.glob), files);
        files.forEach((fileName: Path) => {
          const ext = path.extname(fileName);
          const relativePath = path.relative(this.configDir, fileName);
          if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
            logger.info(`Skipping ${ext} file ${relativePath}`);
            return;
          }

          pathToSubIndex[fileName] = false;
        });

        this.storyIndexEntries.set(specifier, pathToSubIndex);
      })
    );

    // Extract stories for each file
    await this.ensureExtracted();
  }

  async ensureExtracted(): Promise<StoryIndex['stories'][]> {
    return (
      await Promise.all(
        this.specifiers.map(async (specifier) => {
          const entry = this.storyIndexEntries.get(specifier);
          console.log('entries');
          console.log(specifier.glob, Object.keys(entry));
          return Promise.all(
            Object.keys(entry).map(
              async (fileName) => entry[fileName] || this.extractStories(specifier, fileName)
            )
          );
        })
      )
    ).flat();
  }

  async extractStories(specifier: NormalizedStoriesSpecifier, absolutePath: Path) {
    const relativePath = path.relative(this.configDir, absolutePath);
    try {
      const entry = this.storyIndexEntries.get(specifier);
      const fileStories = {} as StoryIndex['stories'];

      const importPath = relativePath[0] === '.' ? relativePath : `./${relativePath}`;
      const defaultTitle = autoTitleFromSpecifier(importPath, specifier);
      const csf = (await readCsfOrMdx(absolutePath, { defaultTitle })).parse();
      csf.stories.forEach(({ id, name }) => {
        fileStories[id] = {
          title: csf.meta.title,
          name,
          importPath,
        };
      });

      entry[absolutePath] = fileStories;
      return fileStories;
    } catch (err) {
      logger.warn(`🚨 Extraction error on ${relativePath}: ${err}`);
      logger.warn(`🚨 ${err.stack}`);
      throw err;
    }
  }

  async sortStories(storiesList: StoryIndex['stories'][]) {
    const stories: StoryIndex['stories'] = {};

    storiesList.forEach((subStories) => {
      Object.assign(stories, subStories);
    });

    const storySortParameter = await this.getStorySortParameter();
    return sortExtractedStories(stories, storySortParameter, this.storyFileNames());
  }

  async getIndex() {
    if (this.lastIndex) return this.lastIndex;

    // Extract any entries that are currently missing
    // Pull out each file's stories into a list of stories, to be composed and sorted
    const storiesList = await this.ensureExtracted();
    console.log('storiesList');
    console.log(storiesList.map((stories) => Object.keys(stories)));

    this.lastIndex = {
      v: 3,
      stories: await this.sortStories(storiesList),
    };

    return this.lastIndex;
  }

  invalidate(specifier: NormalizedStoriesSpecifier, filePath: Path, removed: boolean) {
    const absolutePath = path.join(this.configDir, filePath);
    console.log('invalidate', absolutePath, removed);
    const pathToEntries = this.storyIndexEntries.get(specifier);
    console.log(this.storyIndexEntries.keys());
    console.log('pathToEntries');
    console.log(Object.keys(pathToEntries));

    if (removed) {
      delete pathToEntries[absolutePath];
    } else {
      pathToEntries[absolutePath] = false;
    }
    this.lastIndex = null;
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

  // Get the story file names in "imported order"
  storyFileNames() {
    return Array.from(this.storyIndexEntries.values()).flatMap((r) => Object.keys(r));
  }
}
