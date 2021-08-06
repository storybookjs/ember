import { StoryId, Story, Args } from './types';
import { combineArgs, mapArgsToTypes } from '../args';

export class ArgsStore {
  argsByStoryId: Record<StoryId, Args> = {};

  get(storyId: StoryId) {
    if (!(storyId in this.argsByStoryId)) {
      throw new Error(`No args known for ${storyId} -- has it been rendered yet?`);
    }

    return this.argsByStoryId[storyId];
  }

  setInitial(storyId: StoryId, args: Args) {
    if (!this.argsByStoryId[storyId]) {
      this.argsByStoryId[storyId] = args;
    }
  }

  updateFromPersisted(story: Story<any>, persisted: Args) {
    this.argsByStoryId[story.id] = combineArgs(
      this.argsByStoryId[story.id],
      mapArgsToTypes(persisted, story.argTypes)
    );
  }

  update(storyId: StoryId, argsUpdate: Partial<Args>) {
    if (!(storyId in this.argsByStoryId)) {
      throw new Error(`No args known for ${storyId} -- has it been rendered yet?`);
    }

    this.argsByStoryId[storyId] = { ...this.argsByStoryId[storyId], ...argsUpdate };
  }
}
