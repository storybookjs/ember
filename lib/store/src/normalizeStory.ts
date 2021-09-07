import {
  storyNameFromExport,
  toId,
  ComponentAnnotations,
  AnyFramework,
  LegacyStoryAnnotationsOrFn,
  StoryId,
  StoryAnnotations,
  StoryFn,
} from '@storybook/csf';
import dedent from 'ts-dedent';
import { logger } from '@storybook/client-logger';
import deprecate from 'util-deprecate';
import { NormalizedStoryAnnotations } from './types';
import { normalizeInputTypes } from './normalizeInputTypes';

const deprecatedStoryAnnotation = dedent`
CSF .story annotations deprecated; annotate story functions directly:
- StoryFn.story.name => StoryFn.storyName
- StoryFn.story.(parameters|decorators) => StoryFn.(parameters|decorators)
See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations for details and codemod.
`;

const deprecatedStoryAnnotationWarning = deprecate(() => {}, deprecatedStoryAnnotation);

export function normalizeStory<TFramework extends AnyFramework>(
  key: StoryId,
  storyAnnotations: LegacyStoryAnnotationsOrFn<TFramework>,
  meta: ComponentAnnotations<TFramework>
): NormalizedStoryAnnotations<TFramework> {
  let userStoryFn: StoryFn<TFramework>;
  let storyObject: StoryAnnotations<TFramework>;
  if (typeof storyAnnotations === 'function') {
    userStoryFn = storyAnnotations;
    storyObject = storyAnnotations;
  } else {
    storyObject = storyAnnotations;
  }

  const { story } = storyObject;
  if (story) {
    logger.debug('deprecated story', story);
    deprecatedStoryAnnotationWarning();
  }

  const exportName = storyNameFromExport(key);
  const id = toId(meta.id || meta.title, exportName);
  const name =
    (typeof storyObject !== 'function' && storyObject.name) ||
    storyObject.storyName ||
    story?.name ||
    exportName;
  const decorators = storyObject.decorators || story?.decorators;
  const parameters = storyObject.parameters || story?.parameters;
  const args = storyObject.args || story?.args;
  const argTypes = storyObject.argTypes || story?.argTypes;
  const loaders = storyObject.loaders || story?.loaders;
  const { render, play } = storyObject;

  return {
    id,
    name,
    ...(decorators && { decorators }),
    ...(parameters && { parameters }),
    ...(args && { args }),
    ...(argTypes && { argTypes: normalizeInputTypes(argTypes) }),
    ...(loaders && { loaders }),
    ...(render && { render }),
    ...(userStoryFn && { userStoryFn }),
    ...(play && { play }),
  };
}
