import { ConcreteComponent } from 'vue';
import { Args, ComponentAnnotations, StoryAnnotationsOrFn } from '@storybook/csf';
import { StoryFnVueReturnType } from './types';

export type { Args, ArgTypes, Parameters, StoryContext } from '@storybook/csf';

export type VueFramework = {
  component: ConcreteComponent<any>;
  storyResult: StoryFnVueReturnType;
};

/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/formats/component-story-format/#default-export)
 */
export type Meta<TArgs = Args> = ComponentAnnotations<VueFramework, TArgs>;

/**
 * Story function that represents a component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type Story<TArgs = Args> = StoryAnnotationsOrFn<VueFramework, TArgs>;
