import { StoryId, Args, SelectionSpecifier } from './types';

export class ArgsStore {
  argsByStoryId: Record<StoryId, Args> = {};

  get(storyId: StoryId) {
    if (!(storyId in this.argsByStoryId)) {
      throw new Error(`No args known for ${storyId} -- has it been rendered yet?`);
    }

    return this.argsByStoryId[storyId];
  }

  set(storyId: StoryId, args: Args) {
    this.argsByStoryId[storyId] = args;
  }

  update(storyId: StoryId, argsUpdate: Partial<Args>) {
    if (!(storyId in this.argsByStoryId)) {
      throw new Error(`No args known for ${storyId} -- has it been rendered yet?`);
    }

    this.argsByStoryId[storyId] = { ...this.argsByStoryId[storyId], ...argsUpdate };
  }
}
