import { Channel } from '@storybook/addons';
import { StoryId } from '@storybook/csf';

import { StorySpecifier, StoryIndex, StoryIndexEntry } from './types';

export class StoryIndexStore {
  channel: Channel;

  stories: StoryIndex['stories'];

  constructor({ stories }: StoryIndex = { v: 3, stories: {} }) {
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
