import React, { ComponentType } from 'react';
import ReactDOM from 'react-dom';
import { AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';

import { DocsContextProps } from './types';
import { NoDocs } from './NoDocs';

export class DocsRenderer<TFramework extends AnyFramework> {
  // eslint-disable-next-line no-useless-constructor
  constructor(private story: Story<TFramework>) {}

  render(docsContext: DocsContextProps<TFramework>, element: HTMLElement, callback: () => void) {
    this.renderAsync(docsContext, element).then(callback);
  }

  async renderAsync(docsContext: DocsContextProps<TFramework>, element: HTMLElement) {
    const { docs } = this.story.parameters;
    if ((docs?.getPage || docs?.page) && !(docs?.getContainer || docs?.container)) {
      throw new Error('No `docs.container` set, did you run `addon-docs/preset`?');
    }

    const DocsContainer: ComponentType<{ context: DocsContextProps<TFramework> }> =
      (docs.getContainer && (await docs.getContainer())) ||
      docs.container ||
      (({ children }: { children: Element }) => <>{children}</>);

    const Page: ComponentType = (docs.getPage && (await docs.getPage())) || docs.page || NoDocs;

    // Use `componentId` as a key so that we force a re-render every time
    // we switch components
    const docsElement = (
      <DocsContainer key={this.story.componentId} context={docsContext}>
        <Page />
      </DocsContainer>
    );

    return new Promise<void>((resolve) => {
      ReactDOM.render(docsElement, element, resolve);
    });
  }
}
