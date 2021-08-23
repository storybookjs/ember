import memoize from 'memoizerific';

import {
  Parameters,
  DecoratorFunction,
  Args,
  ArgTypes,
  StoryId,
  StoryName,
  StoryIdentifier,
  ViewMode,
  LegacyStoryFn,
  StoryContextForLoaders,
  StoryContext,
  ComponentTitle,
  Framework,
  GlobalAnnotations,
  ComponentAnnotations,
  StoryAnnotations,
} from '@storybook/csf';

import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import { CSFFile, ModuleImportFn, Story, StoriesList } from './types';
import { HooksContext } from './hooks';

// TODO -- what are reasonable values for these?
const CSF_CACHE_SIZE = 100;
const STORY_CACHE_SIZE = 1000;

export class StoryStore<TFramework extends Framework> {
  storiesList: StoriesListStore;

  importFn: ModuleImportFn;

  globalMeta: GlobalAnnotations<TFramework>;

  globals: GlobalsStore;

  args: ArgsStore;

  hooks: Record<StoryId, HooksContext<TFramework>>;

  processCSFFileWithCache: typeof processCSFFile;

  prepareStoryWithCache: typeof prepareStory;

  constructor({
    importFn,
    globalMeta,
    fetchStoriesList,
  }: {
    importFn: ModuleImportFn;
    globalMeta: GlobalAnnotations<TFramework>;
    fetchStoriesList: () => Promise<StoriesList>;
  }) {
    this.storiesList = new StoriesListStore({ fetchStoriesList });
    this.importFn = importFn;
    this.globalMeta = globalMeta;

    const { globals, globalTypes } = globalMeta;
    this.globals = new GlobalsStore({ globals, globalTypes });
    this.args = new ArgsStore();
    this.hooks = {};

    this.processCSFFileWithCache = memoize(CSF_CACHE_SIZE)(processCSFFile) as typeof processCSFFile;
    this.prepareStoryWithCache = memoize(STORY_CACHE_SIZE)(prepareStory) as typeof prepareStory;
  }

  async initialize() {
    await this.storiesList.initialize();
  }

  updateGlobalAnnotations(globalMeta: GlobalAnnotations<TFramework>) {
    this.globalMeta = globalMeta;
    const { globals, globalTypes } = globalMeta;
    this.globals.resetOnGlobalAnnotationsChange({ globals, globalTypes });
  }

  async loadCSFFileByStoryId(storyId: StoryId): Promise<CSFFile<TFramework>> {
    const path = this.storiesList.storyIdToCSFFilePath(storyId);
    const moduleExports = await this.importFn(path);
    return this.processCSFFileWithCache(moduleExports, path);
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

    const story = this.prepareStoryWithCache(storyMeta, componentMeta, this.globalMeta);
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
