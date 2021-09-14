import type { PartialStoryFn } from '@storybook/csf';
import { WebComponentsFramework } from '@storybook/web-components';
import React from 'react';

import { render } from 'lit-html';

export const prepareForInline = (storyFn: PartialStoryFn<WebComponentsFramework>) => {
  class Story extends React.Component {
    wrapperRef = React.createRef<HTMLElement>();

    componentDidMount(): void {
      render(storyFn(), this.wrapperRef.current);
    }

    render(): React.ReactElement {
      return React.createElement('div', { ref: this.wrapperRef });
    }
  }

  return (React.createElement(Story) as unknown) as React.CElement<{}, React.Component>;
};
