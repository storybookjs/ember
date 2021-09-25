import global from 'global';

import { StoryIndex } from '@storybook/store';

const { fetch, EventSource } = global;

const PATH = './stories.json';

export class StoryIndexClient extends EventSource {
  constructor() {
    super(PATH);
  }

  async fetch() {
    const result = await fetch(PATH);
    return result.json() as StoryIndex;
  }
}
