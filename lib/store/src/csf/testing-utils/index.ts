import {
  isExportStory,
  AnyFramework,
  AnnotatedStoryFn,
  ComponentAnnotations,
  Args,
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

export type StoryFile = { default: any; __esModule?: boolean; __namedExportsOrder?: any };

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];
export function objectEntries<T extends object>(t: T): Entries<T>[] {
  return Object.entries(t) as any;
}

export function composeStory<
  TFramework extends AnyFramework = AnyFramework,
  TArgs extends Args = Args
>(
  story: AnnotatedStoryFn<TFramework, TArgs>,
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
    const context = {
      ...preparedStory,
      hooks: new HooksContext(),
      globals: defaultGlobals,
      args: { ...preparedStory.initialArgs, ...extraArgs },
    } as any;

    return preparedStory.unboundStoryFn(context);
  };

  composedStory.storyName = story.storyName || story.name;
  composedStory.args = preparedStory.initialArgs;
  composedStory.play = preparedStory.playFunction;
  composedStory.parameters = preparedStory.parameters;

  return composedStory;
}

export function composeStories<TModule extends StoryFile>(
  storiesImport: TModule,
  globalConfig: NormalizedProjectAnnotations<AnyFramework>,
  composeStoryFn: typeof composeStory
) {
  const { default: meta, __esModule, __namedExportsOrder, ...stories } = storiesImport;
  const composedStories = objectEntries(stories).reduce((storiesMap, [key, _story]) => {
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
