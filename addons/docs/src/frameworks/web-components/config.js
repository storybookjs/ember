/* global window */
import React from 'react';
import { render } from 'lit-html';
import { extractArgTypes, extractComponentDescription } from './custom-elements';
import { SNIPPET_RENDERED, SourceType } from '../../shared';

export const parameters = {
  docs: {
    extractArgTypes,
    extractComponentDescription,
    inlineStories: true,
    prepareForInline: (storyFn) => {
      class Story extends React.Component {
        constructor(props) {
          super(props);
          this.wrapperRef = React.createRef();
        }

        componentDidMount() {
          render(storyFn(), this.wrapperRef.current);
        }

        render() {
          return React.createElement('div', { ref: this.wrapperRef });
        }
      }
      return React.createElement(Story);
    },
  },
};

function skipSourceRender(context) {
  const sourceParams = context?.parameters.docs?.source;
  const isArgsStory = context?.parameters.__isArgsStory;

  // always render if the user forces it
  if (sourceParams?.type === SourceType.DYNAMIC) {
    return false;
  }

  // never render if the user is forcing the block to render code, or
  // if the user provides code, or if it's not an args story.
  return !isArgsStory || sourceParams?.code || sourceParams?.type === SourceType.code;
}

function sourceDecorator(storyFn, context) {
  var story = storyFn();

  if (!skipSourceRender(context)) {
    const container = document.createElement('div');
    render(story, container);
    const source = container.innerHTML.replace(/<!---->/g, '');
    if (source)
      addons.getChannel().emit(SNIPPET_RENDERED, context?.id, source);
  }

  return story;
}

export const decorators = [sourceDecorator];
