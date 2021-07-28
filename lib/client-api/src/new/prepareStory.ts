import dedent from 'ts-dedent';
import deprecate from 'util-deprecate';

import {
  Parameters,
  StoryMeta,
  ComponentMeta,
  GlobalMeta,
  LegacyStoryFn,
  ArgsStoryFn,
  StoryContext,
  Story,
  Args,
  ArgTypes,
  ArgsEnhancer,
  ArgTypesEnhancer,
  StoryContextForEnhancers,
} from './types';

import { combineParameters } from '../parameters';
import { applyHooks, HooksContext } from '../hooks';
import { validateOptions } from '../args';
import { defaultDecorateStory } from '../decorators';

const argTypeDefaultValueWarning = deprecate(
  () => {},
  dedent`
  \`argType.defaultValue\` is deprecated and will be removed in Storybook 7.0.

  https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-argtype-defaultValue`
);

// Combine all the metadata about a story (both direct and inherited from the component/global scope)
// into a "renderable" story function, with all decorators applied, parameters passed as context etc
//
// Note that this story function is *stateless* in the sense that it does not track args or globals
// Instead, it is expected these are tracked separately (if necessary) and are passed into each invocation.
export function prepareStory<StoryFnReturnType>(
  storyMeta: StoryMeta<StoryFnReturnType>,
  componentMeta: ComponentMeta<StoryFnReturnType>,
  globalMeta: GlobalMeta<StoryFnReturnType>
): Story<StoryFnReturnType> {
  // NOTE: in the current implementation we are doing everything once, up front, rather than doing
  // anything at render time. The assumption is that as we don't load all the stories at once, this
  // will have a limited cost. If this proves misguided, we can refactor it.

  const { id, name } = storyMeta;
  const { title } = componentMeta;

  const parameters: Parameters = combineParameters(
    globalMeta.parameters,
    componentMeta.parameters,
    storyMeta.parameters
  );

  const decorators = [
    ...storyMeta.decorators,
    ...componentMeta.decorators,
    ...globalMeta.decorators,
  ];

  // Currently it is only possible to set these globally
  const {
    applyDecorators = defaultDecorateStory,
    argTypesEnhancers = [],
    argsEnhancers = [],
  } = globalMeta;

  const loaders = [...globalMeta.loaders, ...componentMeta.loaders, ...storyMeta.loaders];

  const hooks = new HooksContext();
  const cleanup = () => hooks.clean();

  const render = storyMeta.render || componentMeta.render || globalMeta.render;

  // TODO -- generalize combineParameters
  const passedArgTypes: ArgTypes = combineParameters(
    globalMeta.argTypes,
    componentMeta.argTypes,
    storyMeta.argTypes
  ) as ArgTypes;

  const { passArgsFirst = true } = parameters;
  // eslint-disable-next-line no-underscore-dangle
  parameters.__isArgsStory = passArgsFirst && render.length > 0;

  // Pull out args[X] || argTypes[X].defaultValue into initialArgs
  // TODO -- generalize combineParameters
  const passedArgs: Args = combineParameters(
    globalMeta.args,
    componentMeta.args,
    storyMeta.args
  ) as Args;

  const defaultArgs: Args = Object.entries(
    passedArgTypes as Record<string, { defaultValue: any }>
  ).reduce((acc, [arg, { defaultValue }]) => {
    if (typeof defaultValue !== 'undefined') {
      acc[arg] = defaultValue;
    }
    return acc;
  }, {} as Args);
  if (Object.keys(defaultArgs).length > 0) {
    argTypeDefaultValueWarning();
  }

  const initialArgsBeforeEnhancers = { ...defaultArgs, ...passedArgs };
  const contextForEnhancers: StoryContextForEnhancers = {
    id,
    name,
    story: name, // Back compat
    title,
    kind: title, // Back compat
    parameters,
    hooks,
    initialArgs: initialArgsBeforeEnhancers,
    argTypes: passedArgTypes,
  };

  contextForEnhancers.initialArgs = argsEnhancers.reduce(
    (accumulatedArgs: Args, enhancer) => ({
      ...accumulatedArgs,
      ...enhancer({
        ...contextForEnhancers,
        initialArgs: accumulatedArgs,
      }),
    }),
    initialArgsBeforeEnhancers
  );

  // BACKCOMPAT: do argTypeEnhancers expect to find existing argTypes on enhancers?
  contextForEnhancers.argTypes = argTypesEnhancers.reduce(
    (accumulatedArgTypes, enhancer) => ({
      ...accumulatedArgTypes,
      ...enhancer({
        ...contextForEnhancers,
        argTypes: accumulatedArgTypes,
      }),
    }),
    contextForEnhancers.argTypes
  );

  const applyLoaders = async (context: StoryContext) => {
    const loadResults = await Promise.all(loaders.map((loader) => loader(context)));
    const loaded = Object.assign({}, ...loadResults);
    return { ...context, loaded };
  };

  const undecoratedStoryFn: LegacyStoryFn<StoryFnReturnType> = (context: StoryContext) => {
    const mappedArgs = Object.entries(context.args).reduce((acc, [key, val]) => {
      const { mapping } = context.argTypes[key] || {};
      acc[key] = mapping && val in mapping ? mapping[val] : val;
      return acc;
    }, {} as Args);

    const validatedContext = {
      ...context,
      args: validateOptions(mappedArgs, context.argTypes),
    };
    return context.parameters.passArgsFirst
      ? (render as ArgsStoryFn<StoryFnReturnType>)(validatedContext.args, validatedContext)
      : (render as LegacyStoryFn<StoryFnReturnType>)(validatedContext);
  };
  // TODO -- should this be unboundStoryFn?
  // TODO -- fix types
  const storyFn = applyHooks(applyDecorators)(undecoratedStoryFn, decorators as any);

  const runPlayFunction = async () => {
    if (parameters.play) {
      return parameters.play();
    }
    return undefined;
  };

  return {
    ...contextForEnhancers,
    applyLoaders,
    storyFn,
    runPlayFunction,
    cleanup,
  };
}

// function preparedStoryToFunction(preparedStory) {
//   return () => {
//     const result = preparedStory.unboundStoryFn(preparedStory.initialContext)
//     preparedStory.cleanup();

//     return result;
//   }
