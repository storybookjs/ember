import {
  isExportStory,
  AnyFramework,
  AnnotatedStoryFn,
  StoryAnnotations,
  ComponentAnnotations,
  ProjectAnnotations,
  Args,
  StoryContext,
} from '@storybook/csf';

import { prepareStory } from '../prepareStory';
import { normalizeStory } from '../normalizeStory';
import { HooksContext } from '../../hooks';
import { normalizeComponentAnnotations } from '../normalizeComponentAnnotations';
import { getValuesFromArgTypes, normalizeProjectAnnotations } from '..';
import type { CSFExports, TestingStoryPlayFn, TestingStory } from './types';

export * from './types';

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const { default: addons, mockChannel } = require('@storybook/addons');
  addons.setChannel(mockChannel());
}

let GLOBAL_STORYBOOK_CONFIG = {};

export function setGlobalConfig<TFramework extends AnyFramework = AnyFramework>(
  config: ProjectAnnotations<TFramework>
) {
  GLOBAL_STORYBOOK_CONFIG = config;
}

export function composeStory<
  TFramework extends AnyFramework = AnyFramework,
  TArgs extends Args = Args
>(
  story: AnnotatedStoryFn<TFramework, TArgs> | StoryAnnotations<TFramework, TArgs>,
  meta: ComponentAnnotations<TFramework, TArgs>,
  globalConfig: ProjectAnnotations<TFramework> = GLOBAL_STORYBOOK_CONFIG,
  defaultConfig: ProjectAnnotations<TFramework> = {}
) {
  if (story === undefined) {
    throw new Error('Expected a story but received undefined.');
  }

  const projectAnnotations = { ...defaultConfig, ...globalConfig };

  const normalizedMeta = normalizeComponentAnnotations(meta);

  const normalizedStory = normalizeStory(story.name, story, normalizedMeta);

  const normalizedProjectAnnotations = normalizeProjectAnnotations(projectAnnotations);

  const preparedStory = prepareStory<TFramework>(
    normalizedStory,
    normalizedMeta,
    normalizedProjectAnnotations
  );

  const defaultGlobals = getValuesFromArgTypes(globalConfig.globalTypes);

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
  composedStory.play = preparedStory.playFunction as TestingStoryPlayFn;
  composedStory.parameters = preparedStory.parameters;

  return composedStory;
}

const getStoryName = (story: TestingStory) => {
  if (story.storyName) {
    return story.storyName;
  }

  if (typeof story !== 'function' && story.name) {
    return story.name;
  }

  return undefined;
};

export function composeStories<TModule extends CSFExports>(
  storiesImport: TModule,
  globalConfig: ProjectAnnotations<AnyFramework>,
  composeStoryFn: typeof composeStory
) {
  const { default: meta, __esModule, __namedExportsOrder, ...stories } = storiesImport;
  const composedStories = Object.entries(stories).reduce((storiesMap, [exportsName, _story]) => {
    if (!isExportStory(exportsName as string, meta)) {
      return storiesMap;
    }

    const story = _story as TestingStory;
    // Ensure story name is already set, else use exportsName as fallback. This is important for scenarios like snapshot testing
    story.storyName = getStoryName(story) || String(exportsName);

    const result = Object.assign(storiesMap, {
      [exportsName]: composeStoryFn(story, meta, globalConfig),
    });
    return result;
  }, {});

  return composedStories;
}
