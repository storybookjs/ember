import {
  isExportStory,
  AnyFramework,
  AnnotatedStoryFn,
  StoryAnnotations,
  ComponentAnnotations,
  Args,
  StoryContext,
} from '@storybook/csf';

import { prepareStory } from '../prepareStory';
import { normalizeStory } from '../normalizeStory';
import { normalizeProjectAnnotations } from '../normalizeProjectAnnotations';
import { HooksContext } from '../../hooks';
import { NormalizedProjectAnnotations } from '../..';

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const { default: addons, mockChannel } = require('@storybook/addons');
  addons.setChannel(mockChannel());
}

export type StoryFile = {
  default: Record<any, any>;
  __esModule?: boolean;
  __namedExportsOrder?: string[];
};

type PartialPlayFn = (
  context: Partial<StoryContext> & Pick<StoryContext, 'canvasElement'>
) => Promise<void> | void;

export function composeStory<
  TFramework extends AnyFramework = AnyFramework,
  TArgs extends Args = Args
>(
  story: AnnotatedStoryFn<TFramework, TArgs> | StoryAnnotations<TFramework, TArgs>,
  meta: ComponentAnnotations<TFramework, TArgs>,
  globalConfig: NormalizedProjectAnnotations<TFramework> = {}
) {
  if (story === undefined) {
    throw new Error('Expected a story but received undefined.');
  }

  const normalizedMeta = normalizeProjectAnnotations(meta);

  const normalizedStory = normalizeStory(story.name, story, normalizedMeta);

  const preparedStory = prepareStory<TFramework>(normalizedStory, normalizedMeta, globalConfig);

  const defaultGlobals = Object.entries(globalConfig.globalTypes || {}).reduce(
    (acc, [arg, { defaultValue }]) => {
      if (defaultValue) {
        acc[arg] = defaultValue;
      }
      return acc;
    },
    {} as Record<string, { defaultValue: any }>
  );

  const composedStory = (extraArgs: Partial<TArgs>) => {
    const context: Partial<StoryContext> = {
      ...preparedStory,
      hooks: new HooksContext(),
      globals: defaultGlobals,
      args: { ...preparedStory.initialArgs, ...extraArgs },
    };

    return preparedStory.unboundStoryFn(context as StoryContext);
  };

  composedStory.storyName = story.storyName || story.name;
  composedStory.args = preparedStory.initialArgs;
  composedStory.play = preparedStory.playFunction as PartialPlayFn;
  composedStory.parameters = preparedStory.parameters;

  return composedStory;
}

export function composeStories<TModule extends StoryFile>(
  storiesImport: TModule,
  globalConfig: NormalizedProjectAnnotations<AnyFramework>,
  composeStoryFn: typeof composeStory
) {
  const { default: meta, __esModule, __namedExportsOrder, ...stories } = storiesImport;
  const composedStories = Object.entries(stories).reduce((storiesMap, [key, _story]) => {
    if (!isExportStory(key as string, meta)) {
      return storiesMap;
    }

    const storyName = String(key);
    const story = _story as any;
    story.storyName = storyName;

    const result = Object.assign(storiesMap, {
      [key]: composeStoryFn(story, meta, globalConfig),
    });
    return result;
  }, {});

  return composedStories;
}
