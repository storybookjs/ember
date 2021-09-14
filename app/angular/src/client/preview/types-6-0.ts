import {
  Args,
  Parameters as DefaultParameters,
  StoryContext as DefaultStoryContext,
  ComponentAnnotations,
  StoryAnnotationsOrFn,
} from '@storybook/csf';

import { StoryFnAngularReturnType } from './types';

export type { Args, ArgTypes } from '@storybook/csf';

export type AngularFramework = {
  component: any;
  storyResult: StoryFnAngularReturnType;
};

/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/formats/component-story-format/#default-export)
 */
export type Meta<TArgs = Args> = ComponentAnnotations<AngularFramework, TArgs>;

/**
 * Story function that represents a component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type Story<TArgs = Args> = StoryAnnotationsOrFn<AngularFramework, TArgs>;

export type Parameters = DefaultParameters & {
  /** Uses legacy angular rendering engine that use dynamic component */
  angularLegacyRendering?: boolean;
  bootstrapModuleOptions?: unknown;
};

export type StoryContext = DefaultStoryContext<AngularFramework> & { parameters: Parameters };
