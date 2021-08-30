import memoize from 'memoizerific';
import {
  Parameters,
  StoryId,
  StoryContextForLoaders,
  Framework,
  GlobalAnnotations,
  ComponentTitle,
} from '@storybook/csf';

import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import {
  CSFFile,
  ModuleImportFn,
  Story,
  StoriesList,
  NormalizedGlobalAnnotations,
  NormalizedStoriesEntry,
  Path,
  ExtractOptions,
} from './types';
import { HooksContext } from './hooks';
import { normalizeInputTypes } from './normalizeInputTypes';

// TODO -- what are reasonable values for these?
const CSF_CACHE_SIZE = 100;
const STORY_CACHE_SIZE = 1000;

function normalizeGlobalAnnotations<TFramework extends Framework>({
  argTypes,
  globalTypes,
  ...annotations
}: GlobalAnnotations<TFramework>): NormalizedGlobalAnnotations<TFramework> {
  return {
    ...(argTypes && { argTypes: normalizeInputTypes(argTypes) }),
    ...(globalTypes && { globalTypes: normalizeInputTypes(globalTypes) }),
    ...annotations,
  };
}

// FIXME: what are we doing with autoTitle and entries?
const entries: NormalizedStoriesEntry[] = [];
export class StoryStore<TFramework extends Framework> {
  storiesList: StoriesListStore;

  importFn: ModuleImportFn;

  globalAnnotations: NormalizedGlobalAnnotations<TFramework>;

  globals: GlobalsStore;

  args: ArgsStore;

  hooks: Record<StoryId, HooksContext<TFramework>>;

  cachedCSFFiles?: Record<Path, CSFFile<TFramework>>;

  processCSFFileWithCache: typeof processCSFFile;

  prepareStoryWithCache: typeof prepareStory;

  constructor({
    importFn,
    globalAnnotations,
    fetchStoriesList,
  }: {
    importFn: ModuleImportFn;
    globalAnnotations: GlobalAnnotations<TFramework>;
    fetchStoriesList: () => Promise<StoriesList>;
  }) {
    this.storiesList = new StoriesListStore({ fetchStoriesList });
    this.importFn = importFn;
    this.globalAnnotations = normalizeGlobalAnnotations(globalAnnotations);

    const { globals, globalTypes } = globalAnnotations;
    this.globals = new GlobalsStore({ globals, globalTypes });
    this.args = new ArgsStore();
    this.hooks = {};

    this.processCSFFileWithCache = memoize(CSF_CACHE_SIZE)(processCSFFile) as typeof processCSFFile;
    this.prepareStoryWithCache = memoize(STORY_CACHE_SIZE)(prepareStory) as typeof prepareStory;
  }

  async initialize() {
    await this.storiesList.initialize();
  }

  updateGlobalAnnotations(globalAnnotations: GlobalAnnotations<TFramework>) {
    this.globalAnnotations = normalizeGlobalAnnotations(globalAnnotations);
    const { globals, globalTypes } = globalAnnotations;
    this.globals.resetOnGlobalAnnotationsChange({ globals, globalTypes });
  }

  async onImportFnChanged({ importFn }: { importFn: ModuleImportFn }) {
    this.importFn = importFn;
    // We need to refetch the stories list as it may have changed too
    await this.storiesList.cacheStoriesList();
  }

  async loadCSFFileByStoryId(storyId: StoryId): Promise<CSFFile<TFramework>> {
    const { importPath, title } = this.storiesList.storyIdToMetadata(storyId);
    const moduleExports = await this.importFn(importPath);
    return this.processCSFFileWithCache(moduleExports, title);
  }

  async loadAllCSFFiles(): Promise<Record<Path, CSFFile<TFramework>>> {
    const importPaths: Record<Path, StoryId> = {};
    Object.entries(this.storiesList.storiesList.stories).forEach(([storyId, { importPath }]) => {
      importPaths[importPath] = storyId;
    });

    const csfFileList = await Promise.all(
      Object.entries(importPaths).map(
        async ([importPath, storyId]): Promise<[Path, CSFFile<TFramework>]> => [
          importPath,
          await this.loadCSFFileByStoryId(storyId),
        ]
      )
    );

    return csfFileList.reduce((acc, [importPath, csfFile]) => {
      acc[importPath] = csfFile;
      return acc;
    }, {} as Record<Path, CSFFile<TFramework>>);
  }

  async cacheAllCSFFiles(): Promise<void> {
    this.cachedCSFFiles = await this.loadAllCSFFiles();
  }

  async loadStory({ storyId }: { storyId: StoryId }): Promise<Story<TFramework>> {
    const csfFile = await this.loadCSFFileByStoryId(storyId);
    return this.storyFromCSFFile({ storyId, csfFile });
  }

  storyFromCSFFile({
    storyId,
    csfFile,
  }: {
    storyId: StoryId;
    csfFile: CSFFile<TFramework>;
  }): Story<TFramework> {
    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = this.prepareStoryWithCache(storyMeta, componentMeta, this.globalAnnotations);
    this.args.setInitial(story.id, story.initialArgs);
    this.hooks[story.id] = new HooksContext();
    return story;
  }

  componentStoriesFromCSFFile({ csfFile }: { csfFile: CSFFile<TFramework> }): Story<TFramework>[] {
    return Object.keys(csfFile.stories).map((storyId: StoryId) =>
      this.storyFromCSFFile({ storyId, csfFile })
    );
  }

  getStoryContext(story: Story<TFramework>): Omit<StoryContextForLoaders<TFramework>, 'viewMode'> {
    return {
      ...story,
      args: this.args.get(story.id),
      globals: this.globals.get(),
      hooks: this.hooks[story.id] as unknown,
    };
  }

  cleanupStory(story: Story<TFramework>): void {
    this.hooks[story.id].clean();
  }

  extract(options: ExtractOptions = {}) {
    if (!this.cachedCSFFiles) {
      throw new Error('Cannot call extract() unless you call cacheAllCSFFiles() first.');
    }

    return Object.entries(this.storiesList.storiesList.stories)
      .map(([storyId, { importPath }]) => {
        const csfFile = this.cachedCSFFiles[importPath];
        const story = this.storyFromCSFFile({ storyId, csfFile });

        // TODO: docs only
        if (options.includeDocsOnly && story.parameters.docsOnly) {
          return false;
        }

        return Object.entries(story).reduce((acc, [key, value]) => {
          if (typeof value === 'function') {
            return acc;
          }
          if (['hooks'].includes(key)) {
            return acc;
          }
          if (Array.isArray(value)) {
            return Object.assign(acc, { [key]: value.slice().sort() });
          }
          return Object.assign(acc, { [key]: value });
        }, {});
      })
      .filter(Boolean);
  }

  getSetStoriesPayload() {
    const stories = this.extract();

    const kindParameters: Parameters = stories.reduce(
      (acc: Parameters, { title }: { title: ComponentTitle }) => {
        acc[title] = {};
        return acc;
      },
      {} as Parameters
    );

    return {
      v: 2,
      globals: this.globals.get(),
      globalParameters: {},
      kindParameters,
      stories,
    };
  }
}
