import React, { ComponentType } from 'react';
import ReactDOM from 'react-dom';
import { AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';

import { DocsContextProps } from './types';
import { NoDocs } from './NoDocs';

export class DocsRenderer<TFramework extends AnyFramework> {
  private DocsContainer: ComponentType<{ context: DocsContextProps<TFramework> }>;

  private Page: ComponentType;

  constructor(private story: Story<TFramework>) {
    const { docs } = this.story.parameters;
    if (docs?.page && !docs?.container) {
      throw new Error('No `docs.container` set, did you run `addon-docs/preset`?');
    }

    this.DocsContainer =
      docs.container || (({ children }: { children: Element }) => <>{children}</>);
    this.Page = docs.page || NoDocs;
  }

  render(docsContext: DocsContextProps<TFramework>, element: HTMLElement, callback: () => void) {
    // Use `componentId` as a key so that we force a re-render every time
    // we switch components
    const docsElement = (
      <this.DocsContainer key={this.story.componentId} context={docsContext}>
        <this.Page />
      </this.DocsContainer>
    );

    ReactDOM.render(docsElement, element, callback);
  }
}
