import {
  composeStory as originalComposeStory,
  composeStories as originalComposeStories,
} from '@storybook/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import { composeConfigs } from '@storybook/preview-web';
import type { AnnotatedStoryFn } from '@storybook/csf';
import { render } from '../preview/render';

import type { Meta, ReactFramework } from '../preview/types-6-0';
import type { StoriesWithPartialProps, GlobalConfig, StoryFile } from './types';

const defaultGlobalConfig: GlobalConfig = {
  render,
};

let globalStorybookConfig = {
  ...defaultGlobalConfig,
};

/** Function that sets the globalConfig of your storybook. The global config is the preview module of your .storybook folder.
 *
 * It should be run a single time, so that your global config (e.g. decorators) is applied to your stories when using `composeStories` or `composeStory`.
 *
 * Example:
 *```jsx
 * // setup.js (for jest)
 * import { setGlobalConfig } from '@storybook/testing-react';
 * import * as globalStorybookConfig from './.storybook/preview';
 *
 * setGlobalConfig(globalStorybookConfig);
 *```
 *
 * @param config - e.g. (import * as globalConfig from '../.storybook/preview')
 */
export function setGlobalConfig(config: GlobalConfig) {
  globalStorybookConfig = composeConfigs([defaultGlobalConfig, config]) as GlobalConfig;
}

export function composeStory<GenericArgs>(
  story: AnnotatedStoryFn<ReactFramework, GenericArgs>,
  meta: Meta<GenericArgs | any>,
  globalConfig: GlobalConfig = globalStorybookConfig
) {
  const projectAnnotations = { ...defaultGlobalConfig, ...globalConfig };

  return originalComposeStory<ReactFramework, GenericArgs>(story, meta, projectAnnotations);
}

export function composeStories<TModule extends StoryFile>(
  storiesImport: TModule,
  globalConfig?: GlobalConfig
) {
  const composedStories = originalComposeStories(storiesImport, globalConfig, composeStory);

  return (composedStories as unknown) as Omit<StoriesWithPartialProps<TModule>, keyof StoryFile>;
}
