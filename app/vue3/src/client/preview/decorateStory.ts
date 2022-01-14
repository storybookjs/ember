import type { ConcreteComponent, Component, ComponentOptions } from 'vue';
import { h } from 'vue';
import { DecoratorFunction, StoryContext, LegacyStoryFn } from '@storybook/csf';
import { sanitizeStoryContextUpdate } from '@storybook/store';

import { VueFramework } from './types-6-0';

/*
  This normalizes a functional component into a render method in ComponentOptions.

  The concept is taken from Vue 3's `defineComponent` but changed from creating a `setup`
  method on the ComponentOptions so end-users don't need to specify a "thunk" as a decorator.
 */
function normalizeFunctionalComponent(options: ConcreteComponent): ComponentOptions {
  return typeof options === 'function' ? { render: options, name: options.name } : options;
}

function prepare(
  rawStory: VueFramework['storyResult'],
  innerStory?: ConcreteComponent
): Component | null {
  const story = rawStory as ComponentOptions;

  if (story == null) {
    return null;
  }

  if (innerStory) {
    return {
      // Normalize so we can always spread an object
      ...normalizeFunctionalComponent(story),
      components: { ...(story.components || {}), story: innerStory },
    };
  }

  return {
    render() {
      return h(story);
    },
  };
}

export function decorateStory(
  storyFn: LegacyStoryFn<VueFramework>,
  decorators: DecoratorFunction<VueFramework>[]
): LegacyStoryFn<VueFramework> {
  return decorators.reduce(
    (decorated: LegacyStoryFn<VueFramework>, decorator) => (context: StoryContext<VueFramework>) => {
      let story: VueFramework['storyResult'];

      const decoratedStory: VueFramework['storyResult'] = decorator((update) => {
        story = decorated({ ...context, ...sanitizeStoryContextUpdate(update) });
        return story;
      }, context);

      if (!story) {
        story = decorated(context);
      }

      if (decoratedStory === story) {
        return story;
      }

      return prepare(decoratedStory, story) as VueFramework['storyResult'];
    },
    (context) => prepare(storyFn(context)) as LegacyStoryFn<VueFramework>
  );
}
