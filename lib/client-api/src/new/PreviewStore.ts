import { StoriesMetadataStore } from './StoriesMetadataStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import { CSFFile, StoryId, Channel, StoriesMetadata, ModuleImporter, GlobalMeta } from './types';

// TODO:
//   - figure out how the channel is wired up? Do we pass it into every substore?

export class PreviewStore<StoryFnReturnType> {
  storiesMetadata: StoriesMetadataStore;

  importer: ModuleImporter;

  globalMeta: GlobalMeta<StoryFnReturnType>;

  globals: GlobalsStore;

  args: ArgsStore;

  constructor({
    channel,
    storiesMetadata,
    importerInput,
  }: {
    channel: Channel;
    storiesMetadata: StoriesMetadata;
    importerInput: ModuleImporter;
  }) {
    this.storiesMetadata = new StoriesMetadataStore(storiesMetadata);
    this.importer = importerInput;
    this.globalMeta = {};
    this.globals = new GlobalsStore({ channel });
    this.args = new ArgsStore({ channel });
  }

  updateGlobalMeta(update: Partial<GlobalMeta<StoryFnReturnType>>) {
    // TODO -- patch in decorators, etc?
    // QN: should this be setGlobalMeta and take the place of finish configuring?
    this.globalMeta = { ...this.globalMeta, ...update };
  }

  // QN: should these two live in a higher layer? perhaps w/ url handling?
  //    - maybe even in the story renderer?
  setConfigurationError() {}

  // TODO
  setStorySelection() {}

  loadCSFFileByStoryId(storyId: StoryId): CSFFile<StoryFnReturnType> {
    const path = this.storiesMetadata.storyIdToCSFFilePath(storyId);

    // TODO -- do we need to cache this? Probably not, as import is self-cached.
    const exports = this.importer(path);

    // TODO -- we should probably cache this, obviously taking into account HMR
    //   -- then again, maybe not; maybe the caching happens in the `prepareStory` layer?
    return processCSFFile(exports);
  }

  renderStoryId(storyId: StoryId) {
    const csfFile = this.loadCSFFileByStoryId(storyId);

    const storyMeta = csfFile[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.metadata;

    const preparedStory = prepareStory(storyMeta, componentMeta, this.globalMeta);

    // TODO -- we need some kind of cache at this point.

    // QN: is this the time when args is set for this story (I think so?)
    // -- although only if this is the first time it is rendered, I guess?
    // QN: how do we currently distinguish first from subsequent render of a story?

    return preparedStory({ globals: this.globals.get() });
  }
}
