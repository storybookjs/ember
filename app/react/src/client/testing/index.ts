import {
  composeStory as originalComposeStory,
  composeStories as originalComposeStories,
  setProjectAnnotations as originalSetProjectAnnotations,
  CSFExports,
  ComposedStory,
  StoriesWithPartialProps,
} from '@storybook/store';
import { ProjectAnnotations, Args } from '@storybook/csf';
import { once } from '@storybook/client-logger';

import { render } from '../preview/render';
import type { Meta, ReactFramework } from '../preview/types-6-0';

/** Function that sets the globalConfig of your storybook. The global config is the preview module of your .storybook folder.
 *
 * It should be run a single time, so that your global config (e.g. decorators) is applied to your stories when using `composeStories` or `composeStory`.
 *
 * Example:
 *```jsx
 * // setup.js (for jest)
 * import { setProjectAnnotations } from '@storybook/react';
 * import * as projectAnnotations from './.storybook/preview';
 *
 * setProjectAnnotations(projectAnnotations);
 *```
 *
 * @param projectAnnotations - e.g. (import * as projectAnnotations from '../.storybook/preview')
 */
export function setProjectAnnotations(
  projectAnnotations: ProjectAnnotations<ReactFramework> | ProjectAnnotations<ReactFramework>[]
) {
  originalSetProjectAnnotations(projectAnnotations);
}

/** Preserved for users migrating from `@storybook/testing-react`.
 *
 * @deprecated Use setProjectAnnotations instead
 */
export function setGlobalConfig(
  projectAnnotations: ProjectAnnotations<ReactFramework> | ProjectAnnotations<ReactFramework>[]
) {
  once.warn(`setGlobalConfig is deprecated. Use setProjectAnnotations instead.`);
  setProjectAnnotations(projectAnnotations);
}

// This will not be necessary once we have auto preset loading
const defaultProjectAnnotations: ProjectAnnotations<ReactFramework> = {
  render,
};

/**
 * Function that will receive a story along with meta (e.g. a default export from a .stories file)
 * and optionally projectAnnotations e.g. (import * from '../.storybook/preview)
 * and will return a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing a story in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStory } from '@storybook/react';
 * import Meta, { Primary as PrimaryStory } from './Button.stories';
 *
 * const Primary = composeStory(PrimaryStory, Meta);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(<Primary>Hello world</Primary>);
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 *```
 *
 * @param story
 * @param componentAnnotations - e.g. (import Meta from './Button.stories')
 * @param [projectAnnotations] - e.g. (import * as projectAnnotations from '../.storybook/preview') this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 * @param [exportsName] - in case your story does not contain a name and you want it to have a name.
 */
export function composeStory<TArgs = Args>(
  story: ComposedStory<ReactFramework, TArgs>,
  componentAnnotations: Meta<TArgs | any>,
  projectAnnotations?: ProjectAnnotations<ReactFramework>,
  exportsName?: string
) {
  return originalComposeStory<ReactFramework, TArgs>(
    story,
    componentAnnotations,
    projectAnnotations,
    defaultProjectAnnotations,
    exportsName
  );
}

/**
 * Function that will receive a stories import (e.g. `import * as stories from './Button.stories'`)
 * and optionally projectAnnotations (e.g. `import * from '../.storybook/preview`)
 * and will return an object containing all the stories passed, but now as a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing stories in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStories } from '@storybook/react';
 * import * as stories from './Button.stories';
 *
 * const { Primary, Secondary } = composeStories(stories);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(<Primary>Hello world</Primary>);
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 *```
 *
 * @param csfExports - e.g. (import * as stories from './Button.stories')
 * @param [projectAnnotations] - e.g. (import * as projectAnnotations from '../.storybook/preview') this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 */
export function composeStories<TModule extends CSFExports<ReactFramework>>(
  csfExports: TModule,
  projectAnnotations?: ProjectAnnotations<ReactFramework>
) {
  const composedStories = originalComposeStories(csfExports, projectAnnotations, composeStory);

  return composedStories as unknown as Omit<
    StoriesWithPartialProps<ReactFramework, TModule>,
    keyof CSFExports
  >;
}
