import {
  DecoratorFunction,
  StoryContext,
  StoryContextUpdate,
  PartialStoryFn,
  LegacyStoryFn,
  Framework,
} from '@storybook/csf';

export function decorateStory<TFramework extends Framework>(
  storyFn: LegacyStoryFn<TFramework>,
  decorator: DecoratorFunction<TFramework>,
  bindWithContext: (storyFn: LegacyStoryFn<TFramework>) => PartialStoryFn<TFramework>
): LegacyStoryFn<TFramework> {
  // Bind the partially decorated storyFn so that when it is called it always knows about the story context,
  // no matter what it is passed directly. This is because we cannot guarantee a decorator will
  // pass the context down to the next decorated story in the chain.
  const boundStoryFunction = bindWithContext(storyFn);

  return (context) => decorator(boundStoryFunction, context);
}

type ContextStore<TFramework extends Framework> = { value?: StoryContext<TFramework> };

export function defaultDecorateStory<TFramework extends Framework>(
  storyFn: LegacyStoryFn<TFramework>,
  decorators: DecoratorFunction<TFramework>[]
): LegacyStoryFn<TFramework> {
  // We use a trick to avoid recreating the bound story function inside `decorateStory`.
  // Instead we pass it a context "getter", which is defined once (at "decoration time")
  // The getter reads a variable which is scoped to this call of `decorateStory`
  // (ie to this story), so there is no possibility of overlap.
  // This will break if you call the same story twice interleaved
  // (React might do it if you rendered the same story twice in the one ReactDom.render call, for instance)
  const contextStore: ContextStore<TFramework> = {};

  /**
   * When you call the story function inside a decorator, e.g.:
   *
   * ```jsx
   * <div>{storyFn({ foo: 'bar' })}</div>
   * ```
   *
   * This will override the `foo` property on the `innerContext`, which gets
   * merged in with the default context
   */
  const bindWithContext = (
    decoratedStoryFn: LegacyStoryFn<TFramework>
  ): PartialStoryFn<TFramework> => ({ args, globals } = {} as StoryContextUpdate) => {
    contextStore.value = {
      ...contextStore.value,
      ...(args && { args }),
      ...(globals && { globals }),
    };
    return decoratedStoryFn(contextStore.value);
  };

  const decoratedWithContextStore = decorators.reduce(
    (story, decorator) => decorateStory(story, decorator, bindWithContext),
    storyFn
  );
  return (context) => {
    contextStore.value = context;
    return decoratedWithContextStore(context); // Pass the context directly into the first decorator
  };
}
