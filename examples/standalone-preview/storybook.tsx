import * as React from 'react';
import { configure, storiesOf, addParameters } from '@storybook/react';
import { DocsPage, DocsContainer } from '@storybook/addon-docs/blocks';

addParameters({
  docsContainer: DocsContainer,
  docs: DocsPage,
});

configure(() => {
  storiesOf('Component 1', module).add('Story 1', () => <div>Component 1 - Story 1</div>);

  storiesOf('Component 2', module)
    .add('Story 1', () => <div>Category 2 - Story 1</div>)
    .add('Story 2', () => <div>Category 2 - Story 2</div>);
}, module);
