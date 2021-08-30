import memoize from 'memoizerific';

import {
  Parameters,
  StoryId,
  StoryContextForLoaders,
  Framework,
  GlobalAnnotations,
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

  getSetStoriesPayload() {
    const { v, stories } = this.storiesList.storiesList;
    const kindParameters: Parameters = Object.values(stories).reduce(
      (acc: Parameters, { title }) => {
        acc[title] = {};
        return acc;
      },
      {} as Parameters
    );

    return {
      v,
      globals: this.globals.get(),
      globalParameters: {},
      kindParameters,
      stories: Object.entries(stories).reduce((acc: any, [id, { name, title, importPath }]) => {
        acc[id] = {
          id,
          name,
          kind: title,
          parameters: { fileName: importPath },
        };
        return acc;
      }, {}),
    };
  }
}
