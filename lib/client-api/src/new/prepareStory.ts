import { StoryMeta, ComponentMeta, GlobalMeta, LegacyStoryFn, StoryContext } from './types';

// Combine all the metadata about a story (both direct and inherited from the component/global scope)
// into a "renderable" story function, with all decorators applied, parameters passed as context etc
//
// Note that this story function is *stateless* in the sense that it does not track args or globals
// Instead, it is expected these are tracked separately (if necessary) and are passed into each invocation.
export function prepareStory<StoryFnReturnType>(
  story: StoryMeta<StoryFnReturnType>,
  component: ComponentMeta<StoryFnReturnType>,
  globals: GlobalMeta<StoryFnReturnType>
) {
  // QN: to what extent should we defer some of this work until render time?

  // Combine parameters
  // Combine decorators and get decorator combination fn
  // Combine args + argTypes
  // Combine loaders

  // Get render + play function

  // Create various functions
  // getDecorated,
  // getOriginal,
  // applyLoaders,
  // runPlayFunction,
  // storyFn,
  // unboundStoryFn,

  // Prepare initial story context
  //  - includes default args (enhanced)
  const initialContext = {
    // QN: who's job is it to emit these?
    initialArgs: {
      /* ... */
    },
  };
  const basicStoryFn = (inputContext: Partial<StoryContext> = {}) => {
    const context = { ...initialContext, ...inputContext };
  };

  // QN: what should the return type here be?
  return Object.assign(basicStoryFn, initialContext, {
    // ?
  });
}
