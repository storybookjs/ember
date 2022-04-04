import {
  isExportStory,
  AnyFramework,
  AnnotatedStoryFn,
  StoryAnnotations,
  ComponentAnnotations,
  ProjectAnnotations,
  Args,
  StoryContext,
  Parameters,
} from '@storybook/csf';

import { composeConfigs } from '../composeConfigs';
import { prepareStory } from '../prepareStory';
import { normalizeStory } from '../normalizeStory';
import { HooksContext } from '../../hooks';
import { normalizeComponentAnnotations } from '../normalizeComponentAnnotations';
import { getValuesFromArgTypes } from '../getValuesFromArgTypes';
import { normalizeProjectAnnotations } from '../normalizeProjectAnnotations';
import type { CSFExports, ComposedStoryPlayFn } from './types';

export * from './types';

let GLOBAL_STORYBOOK_PROJECT_ANNOTATIONS = {};

export function setProjectAnnotations<TFramework extends AnyFramework = AnyFramework>(
  projectAnnotations: ProjectAnnotations<TFramework> | ProjectAnnotations<TFramework>[]
) {
  GLOBAL_STORYBOOK_PROJECT_ANNOTATIONS = Array.isArray(projectAnnotations)
    ? composeConfigs(projectAnnotations)
    : projectAnnotations;
}

interface ComposeStory<TFramework extends AnyFramework = AnyFramework, TArgs extends Args = Args> {
  (
    storyAnnotations: AnnotatedStoryFn<TFramework, TArgs> | StoryAnnotations<TFramework, TArgs>,
    componentAnnotations: ComponentAnnotations<TFramework, TArgs>,
    projectAnnotations: ProjectAnnotations<TFramework>,
    exportsName?: string
  ): {
    (extraArgs: Partial<TArgs>): TFramework['storyResult'];
    storyName: string;
    args: Args;
    play: ComposedStoryPlayFn;
    parameters: Parameters;
  };
}

export function composeStory<
  TFramework extends AnyFramework = AnyFramework,
  TArgs extends Args = Args
>(
  storyAnnotations: AnnotatedStoryFn<TFramework, TArgs> | StoryAnnotations<TFramework, TArgs>,
  componentAnnotations: ComponentAnnotations<TFramework, TArgs>,
  projectAnnotations: ProjectAnnotations<TFramework> = GLOBAL_STORYBOOK_PROJECT_ANNOTATIONS,
  defaultConfig: ProjectAnnotations<TFramework> = {},
  exportsName?: string
) {
  if (storyAnnotations === undefined) {
    throw new Error('Expected a story but received undefined.');
  }

  // @TODO: Support auto title
  // eslint-disable-next-line no-param-reassign
  componentAnnotations.title = componentAnnotations.title ?? 'ComposedStory';
  const normalizedComponentAnnotations = normalizeComponentAnnotations(componentAnnotations);

  const storyName =
    exportsName ||
    storyAnnotations.storyName ||
    storyAnnotations.story?.name ||
    storyAnnotations.name;

  const normalizedStory = normalizeStory(
    storyName,
    storyAnnotations,
    normalizedComponentAnnotations
  );

  const normalizedProjectAnnotations = normalizeProjectAnnotations({
    ...projectAnnotations,
    ...defaultConfig,
  });

  const story = prepareStory<TFramework>(
    normalizedStory,
    normalizedComponentAnnotations,
    normalizedProjectAnnotations
  );

  const defaultGlobals = getValuesFromArgTypes(projectAnnotations.globalTypes);

  const composedStory = (extraArgs: Partial<TArgs>) => {
    const context: Partial<StoryContext> = {
      ...story,
      hooks: new HooksContext(),
      globals: defaultGlobals,
      args: { ...story.initialArgs, ...extraArgs },
    };

    return story.unboundStoryFn(context as StoryContext);
  };

  composedStory.storyName = storyName;
  composedStory.args = story.initialArgs;
  composedStory.play = story.playFunction as ComposedStoryPlayFn;
  composedStory.parameters = story.parameters;

  return composedStory;
}

export function composeStories<TModule extends CSFExports>(
  storiesImport: TModule,
  globalConfig: ProjectAnnotations<AnyFramework>,
  composeStoryFn: ComposeStory
) {
  const { default: meta, __esModule, __namedExportsOrder, ...stories } = storiesImport;
  const composedStories = Object.entries(stories).reduce((storiesMap, [exportsName, story]) => {
    if (!isExportStory(exportsName, meta)) {
      return storiesMap;
    }

    const result = Object.assign(storiesMap, {
      [exportsName]: composeStoryFn(story, meta, globalConfig, exportsName),
    });
    return result;
  }, {});

  return composedStories;
}
