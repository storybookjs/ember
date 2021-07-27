// import global from 'global';

import { StoryId, StorySpecifier, Path, StoriesList } from './types';

// TODO -- can we use fetch? how to do this in a portable way?
// const { fetch } = global;

export class StoriesListStore {
  storiesList: StoriesList;

  // TODO -- add a node-channel and watch it
  // constructor() {}

  async initialize() {
    return this.fetchStoriesList();
  }

  async fetchStoriesList() {
    // TODO -- what is the URL here, how can we get this in a portable way?
    // await fetch('/stories.json')
    this.storiesList = { v: 1, stories: {} };
  }

  storyIdFromSpecifier(specifier: StorySpecifier) {
    const storyIds = Object.keys(this.storiesList.stories);
    if (specifier === '*') {
      // '*' means select the first story. If there is none, we have no selection.
      return storyIds[0];
    }

    if (typeof specifier === 'string') {
      // Find the story with the exact id that matches the specifier (see #11571)
      if (storyIds.indexOf(specifier) >= 0) {
        return specifier;
      }
      // Fallback to the first story that starts with the specifier
      return storyIds.find((storyId) => storyId.startsWith(specifier));
    }

    // Try and find a story matching the name/kind, setting no selection if they don't exist.
    const { name, kind } = specifier;
    return Object.values(this.storiesList.stories).find(
      (story) => story.name === name && story.kind === kind
    )?.id;
  }

  storyIdToCSFFilePath(storyId: StoryId): Path {
    const storyMetadata = this.storiesList.stories[storyId];
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
