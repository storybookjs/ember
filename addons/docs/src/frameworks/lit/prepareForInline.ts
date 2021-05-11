import React from 'react';
import { render, TemplateResult } from 'lit';

export const prepareForInline = (storyFn: () => TemplateResult) => {
  const inlineStory = class Story extends React.Component {
    readonly wrapperRef: React.RefObject<HTMLElement>;

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
  };
  return React.createElement(inlineStory);
};
