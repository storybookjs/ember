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
} from './types';

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
    return processCSFFile({ moduleExports, path });
  }

  async loadStory({ storyId }: { storyId: StoryId }): Promise<Story<StoryFnReturnType>> {
    const csfFile = await this.loadCSFFileByStoryId(storyId);

    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = prepareStory(storyMeta, componentMeta, this.globalMeta);

    // TODO -- we need some kind of cache at this point.

    // TODO(HMR) -- figure out when we set this on first run vs HMR
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
