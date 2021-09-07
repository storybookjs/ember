/* global window */
import { addons } from '@storybook/addons';
import { ArgsStoryFn, StoryContext, StoryFn } from '@storybook/csf';
import dedent from 'ts-dedent';
import { HtmlFramework } from '@storybook/html';

import { SNIPPET_RENDERED, SourceType } from '../../shared';

function skipSourceRender(context: StoryContext<HtmlFramework>) {
  const sourceParams = context?.parameters.docs?.source;
  const isArgsStory = context?.parameters.__isArgsStory;

  // always render if the user forces it
  if (sourceParams?.type === SourceType.DYNAMIC) {
    return false;
  }

  // never render if the user is forcing the block to render code, or
  // if the user provides code, or if it's not an args story.
  return !isArgsStory || sourceParams?.code || sourceParams?.type === SourceType.CODE;
}

// By default, just remove indentation
function defaultTransformSource(source: string) {
  // Have to wrap dedent so it doesn't serialize the context
  return dedent(source);
}

function applyTransformSource(source: string, context: StoryContext<HtmlFramework>): string {
  const docs = context.parameters.docs ?? {};
  const transformSource = docs.transformSource ?? defaultTransformSource;
  return transformSource(source, context);
}

export function sourceDecorator(
  storyFn: StoryFn<HtmlFramework>,
  context: StoryContext<HtmlFramework>
) {
  const story = context?.parameters.docs?.source?.excludeDecorators
    ? (context.originalStoryFn as ArgsStoryFn<HtmlFramework>)(context.args, context)
    : storyFn();

  if (typeof story === 'string' && !skipSourceRender(context)) {
    const source = applyTransformSource(story, context);

    addons.getChannel().emit(SNIPPET_RENDERED, context.id, source);
  }

  return story;
}
