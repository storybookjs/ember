import memoize from 'memoizerific';

import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import {
  CSFFile,
  StoryId,
  ModuleImportFn,
  GlobalMeta,
  StoryMeta,
  Story,
  StoryContext,
  StoriesList,
  Parameters,
} from './types';
import { HooksContext } from '../hooks';

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

  hooks: Record<StoryId, HooksContext>;

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
    this.hooks = {};
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
    return this.storyFromCSFFile({ storyId, csfFile });
  }

  storyFromCSFFile({
    storyId,
    csfFile,
  }: {
    storyId: StoryId;
    csfFile: CSFFile<StoryFnReturnType>;
  }): Story<StoryFnReturnType> {
    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = prepareStoryWithCache(storyMeta, componentMeta, this.globalMeta);
    this.args.set(story.id, story.initialArgs);
    this.hooks[story.id] = new HooksContext();
    return story;
  }

  componentStoriesFromCSFFile({
    csfFile,
  }: {
    csfFile: CSFFile<StoryFnReturnType>;
  }): Story<StoryFnReturnType>[] {
    return Object.keys(csfFile.stories).map((storyId: StoryId) =>
      this.storyFromCSFFile({ storyId, csfFile })
    );
  }

  getStoryContext(story: Story<StoryFnReturnType>): StoryContext {
    return {
      ...story,
      args: this.args.get(story.id),
      globals: this.globals.get(),
      hooks: this.hooks[story.id],
    };
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
