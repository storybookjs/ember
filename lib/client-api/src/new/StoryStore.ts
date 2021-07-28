import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import { Args, CSFFile, StoryId, ModuleImportFn, GlobalMeta, Story, StoryContext } from './types';

export class StoryStore<StoryFnReturnType> {
  storiesList: StoriesListStore;

  importFn: ModuleImportFn;

  globalMeta: GlobalMeta<StoryFnReturnType>;

  globals: GlobalsStore;

  args: ArgsStore;

  constructor({
    importFn,
    globalMeta,
  }: {
    importFn: ModuleImportFn;
    globalMeta: GlobalMeta<StoryFnReturnType>;
  }) {
    this.storiesList = new StoriesListStore();
    this.importFn = importFn;
    this.globalMeta = globalMeta;

    const { globals, globalTypes } = globalMeta;
    this.globals = new GlobalsStore({ globals, globalTypes });
    this.args = new ArgsStore();
  }

  async initialize() {
    await this.storiesList.initialize();
  }

  loadCSFFileByStoryId(storyId: StoryId): CSFFile<StoryFnReturnType> {
    const path = this.storiesList.storyIdToCSFFilePath(storyId);
    const moduleExports = this.importFn(path);
    return processCSFFile({ moduleExports, path });
  }

  loadStory({ storyId }: { storyId: StoryId }): Story<StoryFnReturnType> {
    const csfFile = this.loadCSFFileByStoryId(storyId);

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
}
