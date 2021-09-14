import { AnyComponent } from 'preact';
import { Args, ComponentAnnotations, StoryAnnotationsOrFn } from '@storybook/csf';
import { StoryFnPreactReturnType } from './types';

export type { Args, ArgTypes, Parameters, StoryContext } from '@storybook/csf';

export type PreactFramework = {
  component: AnyComponent<any, any>;
  storyResult: StoryFnPreactReturnType;
};

/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/formats/component-story-format/#default-export)
 */
export type Meta<TArgs = Args> = ComponentAnnotations<PreactFramework, TArgs>;

/**
 * Story function that represents a component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type Story<TArgs = Args> = StoryAnnotationsOrFn<PreactFramework, TArgs>;
