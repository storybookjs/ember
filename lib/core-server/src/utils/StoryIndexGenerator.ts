import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import slash from 'slash';

import {
  autoTitleFromSpecifier,
  sortStoriesV7,
  Path,
  StoryIndex,
  V2CompatIndexEntry,
  StoryId,
} from '@storybook/store';
import { NormalizedStoriesSpecifier } from '@storybook/core-common';
import { logger } from '@storybook/node-logger';
import { readCsfOrMdx, getStorySortParameter } from '@storybook/csf-tools';
import { ComponentTitle } from '@storybook/csf';

function sortExtractedStories(
  stories: StoryIndex['stories'],
  storySortParameter: any,
  fileNameOrder: string[]
) {
  const sortableStories = Object.values(stories);
  sortStoriesV7(sortableStories, storySortParameter, fileNameOrder);
  return sortableStories.reduce((acc, item) => {
    acc[item.id] = item;
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
    public readonly options: {
      workingDir: Path;
      configDir: Path;
      storiesV2Compatibility: boolean;
    }
  ) {
    this.storyIndexEntries = new Map();
  }

  async initialize() {
    // Find all matching paths for each specifier
    await Promise.all(
      this.specifiers.map(async (specifier) => {
        const pathToSubIndex = {} as SpecifierStoriesCache;

        const fullGlob = slash(
          path.join(this.options.workingDir, specifier.directory, specifier.files)
        );
        const files = await glob(fullGlob);
        files.forEach((absolutePath: Path) => {
          const ext = path.extname(absolutePath);
          const relativePath = path.relative(this.options.workingDir, absolutePath);
          if (!['.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) {
            logger.info(`Skipping ${ext} file ${relativePath}`);
            return;
          }

          pathToSubIndex[absolutePath] = false;
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
          return Promise.all(
            Object.keys(entry).map(
              async (absolutePath) =>
                entry[absolutePath] || this.extractStories(specifier, absolutePath)
            )
          );
        })
      )
    ).flat();
  }

  async extractStories(specifier: NormalizedStoriesSpecifier, absolutePath: Path) {
    const relativePath = path.relative(this.options.workingDir, absolutePath);
    try {
      const entry = this.storyIndexEntries.get(specifier);
      const fileStories = {} as StoryIndex['stories'];

      const importPath = slash(relativePath[0] === '.' ? relativePath : `./${relativePath}`);
      const defaultTitle = autoTitleFromSpecifier(importPath, specifier);
      const csf = (await readCsfOrMdx(absolutePath, { defaultTitle })).parse();
      csf.stories.forEach(({ id, name }) => {
        fileStories[id] = {
          id,
          title: csf.meta.title,
          name,
          importPath,
        };
      });

      entry[absolutePath] = fileStories;
      return fileStories;
    } catch (err) {
      logger.warn(`🚨 Extraction error on ${relativePath}: ${err}`);
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

    const sorted = await this.sortStories(storiesList);

    let compat = sorted;
    if (this.options.storiesV2Compatibility) {
      const titleToStoryCount = Object.values(sorted).reduce((acc, story) => {
        acc[story.title] = (acc[story.title] || 0) + 1;
        return acc;
      }, {} as Record<ComponentTitle, number>);

      compat = Object.entries(sorted).reduce((acc, entry) => {
        const [id, story] = entry;
        acc[id] = {
          ...story,
          id,
          kind: story.title,
          story: story.name,
          parameters: {
            __id: story.id,
            docsOnly: titleToStoryCount[story.title] === 1 && story.name === 'Page',
            fileName: story.importPath,
          },
        };
        return acc;
      }, {} as Record<StoryId, V2CompatIndexEntry>);
    }

    this.lastIndex = {
      v: 3,
      stories: compat,
    };

    return this.lastIndex;
  }

  invalidate(specifier: NormalizedStoriesSpecifier, importPath: Path, removed: boolean) {
    const absolutePath = path.resolve(this.options.workingDir, importPath);
    const pathToEntries = this.storyIndexEntries.get(specifier);

    if (removed) {
      delete pathToEntries[absolutePath];
    } else {
      pathToEntries[absolutePath] = false;
    }
    this.lastIndex = null;
  }

  async getStorySortParameter() {
    const previewFile = ['js', 'jsx', 'ts', 'tsx']
      .map((ext) => path.join(this.options.configDir, `preview.${ext}`))
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
