import createChannel from '@storybook/channel-websocket';
import { Channel } from '@storybook/addons';

import { StoryId, StorySpecifier, Path, StoriesList } from './types';

export class StoriesListStore {
  fetchStoriesList: () => Promise<StoriesList>;

  channel: Channel;

  storiesList: StoriesList;

  constructor({ fetchStoriesList }: { fetchStoriesList: () => Promise<StoriesList> }) {
    this.fetchStoriesList = fetchStoriesList;

    // TODO -- where do we get the URL from?
    this.channel = createChannel({
      url: 'ws://localhost:8080',
      async: false,
      onError: this.onChannelError.bind(this),
    });
  }

  async initialize() {
    // TODO -- constants
    // this.channel.on('INITIALIZE_STORIES', this.onStoriesChanged.bind(this));
    this.channel.on('PATCH_STORIES', this.onStoriesChanged.bind(this));
    this.channel.on('DELETE_STORIES', this.onStoriesChanged.bind(this));

    return this.cacheStoriesList();
  }

  // TODO -- what to do here?
  onChannelError(err: Error) {
    console.log(err);
  }

  async onStoriesChanged() {
    console.log('onStoriesChanged');
    this.storiesList = await this.fetchStoriesList();
  }

  async cacheStoriesList() {
    this.storiesList = await this.fetchStoriesList();
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
