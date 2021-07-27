import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import { Args, CSFFile, StoryId, ModuleImportFn, GlobalMeta, Story, StoryContext } from './types';
import { combineArgs, mapArgsToTypes } from '../args';

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

  getStory({
    storyId,
    cachedArgs,
  }: {
    storyId: StoryId;
    cachedArgs?: Args;
  }): Story<StoryFnReturnType> {
    const csfFile = this.loadCSFFileByStoryId(storyId);

    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = prepareStory(storyMeta, componentMeta, this.globalMeta);

    // TODO -- we need some kind of cache at this point.

    let { initialArgs } = story;
    if (cachedArgs) {
      initialArgs = combineArgs(initialArgs, mapArgsToTypes(cachedArgs, story.argTypes));
    }
    this.args.set(storyId, initialArgs);

    // QN: how do we currently distinguish first from subsequent render of a story?
    // -- ANS: we have a concept of "unmounting" a story
    // -- second answer: the StoryRenderer currently knows

    // TODO
    // If we are setting args once when the story is first rendered, we need to
    // some how do it at the point of rendering

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
