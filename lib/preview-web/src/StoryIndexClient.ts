// NOTE that this file is duplicated in lib/api
// We aren't currently sure what the long term future the SSE approach is and there's no
// obvious common place to put it right now.
import global from 'global';

import { StoryIndex } from '@storybook/store';

const { window, fetch, CONFIG_TYPE } = global;

const PATH = './stories.json';

// The stories.json endpoint both serves the basic data on a `GET` request and a stream of
// invalidation events when called as a `event-stream` (i.e. via SSE).
export class StoryIndexClient {
  source: EventSource;

  constructor() {
    if (CONFIG_TYPE === 'DEVELOPMENT') {
      this.source = new window.EventSource(PATH);
    }
  }

  // Silently never emit events in bult storybook modes
  addEventListener(event: string, cb: (...args: any[]) => void) {
    if (this.source) this.source.addEventListener(event, cb);
  }

  async fetch() {
    const result = await fetch(PATH);

    if (result.status === 200) return result.json() as StoryIndex;

    throw new Error(await result.text());
  }
}
