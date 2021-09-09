import { Channel } from '@storybook/addons';
import { StoryId } from '@storybook/csf';

import { StorySpecifier, StoryIndex, StoryIndexEntry } from './types';

type MaybePromise<T> = Promise<T> | T;

export class StoryIndexStore {
  fetchStoryIndex: () => MaybePromise<StoryIndex>;

  channel: Channel;

  stories: Record<StoryId, StoryIndexEntry>;

  constructor({ fetchStoryIndex }: { fetchStoryIndex: StoryIndexStore['fetchStoryIndex'] }) {
    this.fetchStoryIndex = fetchStoryIndex;
  }

  initialize(options: { sync: false }): Promise<void>;

  initialize(options: { sync: true }): void;

  initialize({ sync = false } = {}) {
    return sync ? this.cache(true) : this.cache(false);
  }

  cache(sync: false): Promise<void>;

  cache(sync: true): void;

  cache(sync = false): Promise<void> | void {
    const fetchResult = this.fetchStoryIndex();

    if (sync) {
      if (!(fetchResult as StoryIndex).v) {
        throw new Error(
          `fetchStoryIndex() didn't return an index, did you pass an async version then call initialize({ sync: true })?`
        );
      }
      this.stories = (fetchResult as StoryIndex).stories;
      return null;
    }

    return Promise.resolve(fetchResult).then(({ stories }) => {
      this.stories = stories;
    });
  }

  async onStoriesChanged() {
    const { stories } = await this.fetchStoryIndex();
    this.stories = stories;
  }

  storyIdFromSpecifier(specifier: StorySpecifier) {
    const storyIds = Object.keys(this.stories);
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
    const { name, title } = specifier;
    const match = Object.entries(this.stories).find(
      ([id, story]) => story.name === name && story.title === title
    );

    return match && match[0];
  }

  storyIdToEntry(storyId: StoryId): StoryIndexEntry {
    const storyEntry = this.stories[storyId];
    if (!storyEntry) {
      throw new Error(`Didn't find '${storyId}' in story index (\`stories.json\`)`);
    }

    return storyEntry;
  }
}
