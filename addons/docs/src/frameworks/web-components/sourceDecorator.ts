/* global window */
import { render } from 'lit-html';
import { ArgsStoryFn, PartialStoryFn, StoryContext } from '@storybook/csf';
import { addons } from '@storybook/addons';
import { WebComponentsFramework } from '@storybook/web-components';

import { SNIPPET_RENDERED, SourceType } from '../../shared';

function skipSourceRender(context: StoryContext<WebComponentsFramework>) {
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

function applyTransformSource(
  source: string,
  context: StoryContext<WebComponentsFramework>
): string {
  const { transformSource } = context.parameters.docs ?? {};
  if (typeof transformSource !== 'function') return source;
  return transformSource(source, context);
}

export function sourceDecorator(
  storyFn: PartialStoryFn<WebComponentsFramework>,
  context: StoryContext<WebComponentsFramework>
) {
  const story = context?.parameters.docs?.source?.excludeDecorators
    ? (context.originalStoryFn as ArgsStoryFn<WebComponentsFramework>)(context.args, context)
    : storyFn();

  if (!skipSourceRender(context)) {
    const container = window.document.createElement('div');
    render(story, container);
    const source = applyTransformSource(container.innerHTML.replace(/<!---->/g, ''), context);
    if (source) addons.getChannel().emit(SNIPPET_RENDERED, context.id, source);
  }

  return story;
}
