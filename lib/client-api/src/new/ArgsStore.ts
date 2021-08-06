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
    // NOTE: we use `combineArgs` here rather than `combineParameters` because changes to arg
    // array values are persisted in the URL as sparse arrays, and we have to take that into
    // account when overriding the initialArgs (e.g. we patch [,'changed'] over ['initial', 'val'])
    this.argsByStoryId[story.id] = combineArgs(
      this.argsByStoryId[story.id],
      // Use the argType to ensure we aren't persisting the wrong type of value to the type.
      // For instance you could try and set a string-valued arg to a number by changing the URL
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
