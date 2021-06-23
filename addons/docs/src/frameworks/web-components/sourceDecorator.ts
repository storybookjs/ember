/* global window */
import { render } from 'lit-html';
import { addons, StoryContext, StoryFn } from '@storybook/addons';
import { SNIPPET_RENDERED, SourceType } from '../../shared';

function skipSourceRender(context: StoryContext) {
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

export function sourceDecorator(storyFn: StoryFn, context: StoryContext) {
  const story = storyFn();

  if (!skipSourceRender(context)) {
    const container = window.document.createElement('div');
    render(story, container);
    const source = container.innerHTML.replace(/<!---->/g, '');
    if (source) addons.getChannel().emit(SNIPPET_RENDERED, context?.id, source);
  }

  return story;
}
