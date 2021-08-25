import {
  storyNameFromExport,
  toId,
  ComponentAnnotations,
  Framework,
  DecoratorFunction,
  ArgTypes,
  StoryAnnotationsOrFn,
  StoryId,
  StoryAnnotations,
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

export function normalizeStory<TFramework extends Framework>(
  key: StoryId,
  storyAnnotations: StoryAnnotationsOrFn<TFramework>,
  meta: ComponentAnnotations<TFramework>
): NormalizedStoryAnnotations<TFramework> {
  let storyObject: StoryAnnotations<TFramework>;
  if (typeof storyAnnotations === 'function') {
    // eslint-disable-next-line prefer-object-spread
    storyObject = Object.assign({ render: storyAnnotations }, storyAnnotations);
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
  const name = storyObject.name || storyObject.storyName || story?.name || exportName;
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
    ...(play && { play }),
  };
}
