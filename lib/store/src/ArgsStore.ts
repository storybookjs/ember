import { StoryId, Story, Args } from './types';
import { combineArgs, mapArgsToTypes, validateOptions, deepDiff, DEEPLY_EQUAL } from './args';

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
    // Use the argType to ensure we aren't persisting the wrong type of value to the type.
    // For instance you could try and set a string-valued arg to a number by changing the URL
    const mappedPersisted = mapArgsToTypes(persisted, story.argTypes);

    // Use the argType to ensure we setting a type with defined options to something outside of that
    const validatedPersisted = validateOptions(mappedPersisted, story.argTypes);

    // NOTE: we use `combineArgs` here rather than `combineParameters` because changes to arg
    // array values are persisted in the URL as sparse arrays, and we have to take that into
    // account when overriding the initialArgs (e.g. we patch [,'changed'] over ['initial', 'val'])
    this.argsByStoryId[story.id] = combineArgs(this.argsByStoryId[story.id], validatedPersisted);
  }

  resetOnImplementationChange(story: Story<any>, previousStory: Story<any>) {
    const delta = deepDiff(previousStory.initialArgs, this.get(story.id));

    this.argsByStoryId[story.id] = story.initialArgs;
    if (delta !== DEEPLY_EQUAL) {
      this.updateFromPersisted(story, delta);
    }
  }

  update(storyId: StoryId, argsUpdate: Partial<Args>) {
    if (!(storyId in this.argsByStoryId)) {
      throw new Error(`No args known for ${storyId} -- has it been rendered yet?`);
    }

    this.argsByStoryId[storyId] = { ...this.argsByStoryId[storyId], ...argsUpdate };
  }
}
