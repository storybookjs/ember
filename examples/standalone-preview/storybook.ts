import { configure, addParameters } from '@storybook/react';
import { DocsPage, DocsContainer } from '@storybook/addon-docs';

import * as Comp1 from './stories/Component1.stories';
import * as Comp2 from './stories/Component2.stories';

addParameters({
  docs: {
    page: DocsPage,
    container: DocsContainer,
  },
});

configure(() => [Comp1, Comp2], module);
