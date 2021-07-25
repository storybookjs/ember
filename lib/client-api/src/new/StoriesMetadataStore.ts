import { StoryId, ModuleImporter, Path, StoriesMetadata } from './types';

export class StoriesMetadataStore {
  storiesMetadata: StoriesMetadata;

  constructor(storiesMetadataInput: StoriesMetadata) {
    this.storiesMetadata = storiesMetadataInput;

    // TODO -- add a channel and watch it
  }

  storyIdToCSFFilePath(storyId: StoryId): Path {
    const storyMetadata = this.storiesMetadata.stories[storyId];
    if (!storyMetadata) {
      throw new Error(`Didn't find '${storyId}' in story metadata (\`stories.json\`)`);
    }

    const path = storyMetadata.parameters?.fileName;
    if (!path) {
      // TODO: Is this possible or are we guaranteeing this will exist now?
      throw new Error(
        `No \`parameters.fileName\` for '${storyId}' in story metadata (\`stories.json\`)`
      );
    }

    return path;
  }
}
