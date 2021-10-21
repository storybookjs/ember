import { ConcreteComponent } from 'vue';
import { Args, ComponentAnnotations, StoryAnnotations, AnnotatedStoryFn } from '@storybook/csf';
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
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryFn<TArgs = Args> = AnnotatedStoryFn<VueFramework, TArgs>;

/**
 * Story function that represents a CSFv3 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryObj<TArgs = Args> = StoryAnnotations<VueFramework, TArgs>;

/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 *
 * NOTE that in Storybook 7.0, this type will be renamed to `StoryFn` and replaced by the current `StoryObj` type.
 *
 */
export type Story<TArgs = Args> = StoryFn<TArgs>;
