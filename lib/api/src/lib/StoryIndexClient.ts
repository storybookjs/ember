import global from 'global';

import { StoryIndex } from './stories';

const { fetch } = global;

const PATH = './stories.json';

// eslint-disable-next-line no-undef
export class StoryIndexClient extends EventSource {
  constructor() {
    super(PATH);
  }

  async fetch() {
    const result = await fetch(PATH);
    return result.json() as StoryIndex;
  }
}
