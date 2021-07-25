import { Channel, StoryId, Args } from './types';

export class ArgsStore {
  argsByStoryId: Record<StoryId, Args>;

  constructor({ channel }: { channel: Channel }) {
    // TODO -- watch + emit on channel

    // QN -- how do args get initialized?
    //   -- we need pass args when a story is first rendered
    this.argsByStoryId = {};
  }

  argsForStoryId(storyId: StoryId) {
    if (!storyId in this.argsForStoryId) {
      throw new Error(`No args know for ${storyId} -- has it been rendered yet?`);
    }

    return this.argsByStoryId[storyId];
  }

  updateArgsByStoryId() {
    // TODO: set, emit
  }
}
