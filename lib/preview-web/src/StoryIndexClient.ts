// NOTE that this file is duplicated in lib/api
// We aren't currently sure what the long term future the SSE approach is and there's no
// obvious common place to put it right now.
import global from 'global';

import { StoryIndex } from '@storybook/store';

const { fetch } = global;

const PATH = './stories.json';
// The stories.json endpoint both serves the basic data on a `GET` request and a stream of
// invalidation events when called as a `event-stream` (i.e. via SSE).
// So the `StoryIndexClient` is a EventSource that can also do a fetch

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
