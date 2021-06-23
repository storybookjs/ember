import React from 'react';
import { render } from 'lit-html';
import { extractArgTypes, extractComponentDescription } from './custom-elements';
import { sourceDecorator } from './sourceDecorator';

export const decorators = [sourceDecorator];

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
