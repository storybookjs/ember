import Vue, { VueConstructor, ComponentOptions } from 'vue';
import { DecoratorFunction, StoryContext, LegacyStoryFn } from '@storybook/csf';
import { sanitizeStoryContextUpdate } from '@storybook/store';

import { StoryFnVueReturnType } from './types';
import { VueFramework } from './types-6-0';
import { extractProps } from './util';
import { VALUES } from './render';

export const WRAPS = 'STORYBOOK_WRAPS';

function prepare(
  rawStory: StoryFnVueReturnType,
  innerStory?: VueConstructor
): VueConstructor | null {
  let story: ComponentOptions<Vue> | VueConstructor;

  if (typeof rawStory === 'string') {
    story = { template: rawStory };
  } else if (rawStory != null) {
    story = rawStory as ComponentOptions<Vue>;
  } else {
    return null;
  }

  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  if (!story._isVue) {
    if (innerStory) {
      story.components = { ...(story.components || {}), story: innerStory };
    }
    story = Vue.extend(story);
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307984824
  } else if (story.options[WRAPS]) {
    return story as VueConstructor;
  }

  return Vue.extend({
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307985279
    [WRAPS]: story,
    // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307984824
    [VALUES]: { ...(innerStory ? innerStory.options[VALUES] : {}), ...extractProps(story) },
    functional: true,
    render(h, { data, parent, children }) {
      return h(
        story,
        {
          ...data,
          // @ts-ignore // https://github.com/storybookjs/storybook/pull/7578#discussion_r307986196
          props: { ...(data.props || {}), ...parent.$root[VALUES] },
        },
        children
      );
    },
  });
}

export function decorateStory(
  storyFn: LegacyStoryFn<VueFramework>,
  decorators: DecoratorFunction<VueFramework>[]
): LegacyStoryFn<VueFramework> {
  return decorators.reduce(
    (decorated: LegacyStoryFn<VueFramework>, decorator) => (
      context: StoryContext<VueFramework>
    ) => {
      let story;

      const decoratedStory = decorator((update) => {
        story = decorated({ ...context, ...sanitizeStoryContextUpdate(update) });
        return story;
      }, context);

      if (!story) {
        story = decorated(context);
      }

      if (decoratedStory === story) {
        return story;
      }

      return prepare(decoratedStory, story as any);
    },
    (context) => prepare(storyFn(context))
  );
}
