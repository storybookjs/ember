/* global window */
import React from 'react';
import { render, TemplateResult } from 'lit';

export const parameters = {
  docs: {
    inlineStories: true,
    prepareForInline: (storyFn: () => TemplateResult) => {
      class Story extends React.Component {
        private readonly wrapperRef: React.RefObject<HTMLElement>;

        constructor(props: unknown) {
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
