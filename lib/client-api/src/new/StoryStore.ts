import memoize from 'memoizerific';

import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import {
  Args,
  CSFFile,
  StoryId,
  ModuleImportFn,
  GlobalMeta,
  Story,
  StoryContext,
  StoriesList,
  Parameters,
  ModuleExports,
} from './types';

// TODO -- what are reasonable values for these?
const CSF_CACHE_SIZE = 100;
const STORY_CACHE_SIZE = 1000;

// TODO -- are these caches even worth it? how long does it actually take to process/prepare a single story?
const processCSFFileWithCache = memoize(CSF_CACHE_SIZE)(processCSFFile);
const prepareStoryWithCache = memoize(STORY_CACHE_SIZE)(prepareStory);

export class StoryStore<StoryFnReturnType> {
  storiesList: StoriesListStore;

  importFn: ModuleImportFn;

  globalMeta: GlobalMeta<StoryFnReturnType>;

  globals: GlobalsStore;

  args: ArgsStore;

  constructor({
    importFn,
    globalMeta,
    fetchStoriesList,
  }: {
    importFn: ModuleImportFn;
    globalMeta: GlobalMeta<StoryFnReturnType>;
    fetchStoriesList: () => Promise<StoriesList>;
  }) {
    this.storiesList = new StoriesListStore({ fetchStoriesList });
    this.importFn = importFn;
    this.globalMeta = globalMeta;

    const { globals, globalTypes } = globalMeta;
    this.globals = new GlobalsStore({ globals, globalTypes });
    this.args = new ArgsStore();
  }

  async initialize() {
    await this.storiesList.initialize();
  }

  async loadCSFFileByStoryId(storyId: StoryId): Promise<CSFFile<StoryFnReturnType>> {
    const path = this.storiesList.storyIdToCSFFilePath(storyId);
    const moduleExports = await this.importFn(path);
    return processCSFFileWithCache(moduleExports, path);
  }

  async loadStory({ storyId }: { storyId: StoryId }): Promise<Story<StoryFnReturnType>> {
    const csfFile = await this.loadCSFFileByStoryId(storyId);

    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = prepareStoryWithCache(storyMeta, componentMeta, this.globalMeta);

    this.args.set(storyId, story.initialArgs);

    return story;
  }

  getStoryContext(story: Story<StoryFnReturnType>): StoryContext {
    return {
      ...story,
      args: this.args.get(story.id),
      globals: this.globals.get(),
    };
  }

  getSetStoriesPayload() {
    const { v, stories } = this.storiesList.storiesList;
    const kindParameters: Parameters = Object.values(stories).reduce(
      (acc: Parameters, { kind }) => {
        acc[kind] = {};
        return acc;
      },
      {} as Parameters
    );

    return {
      v,
      globals: this.globals.get(),
      globalParameters: {},
      kindParameters,
      stories,
    };
  }
}
