import type { ConcreteComponent, Component, ComponentOptions, App } from 'vue';
import { h } from 'vue';
import { start } from '@storybook/core/client';
import { DecoratorFunction, StoryContext, LegacyStoryFn } from '@storybook/csf';
import { ClientStoryApi, Loadable } from '@storybook/addons';
import { sanitizeStoryContextUpdate } from '@storybook/store';

import './globals';
import { IStorybookSection } from './types';
import { VueFramework } from './types-6-0';

import { renderToDOM, storybookApp } from './render';

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

function decorateStory(
  storyFn: LegacyStoryFn<VueFramework>,
  decorators: DecoratorFunction<VueFramework>[]
): LegacyStoryFn<VueFramework> {
  return decorators.reduce(
    (decorated: LegacyStoryFn<VueFramework>, decorator) => (
      context: StoryContext<VueFramework>
    ) => {
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
const framework = 'vue3';

interface ClientApi extends ClientStoryApi<VueFramework['storyResult']> {
  setAddon(addon: any): void;
  configure(loader: Loadable, module: NodeModule): void;
  getStorybook(): IStorybookSection[];
  clearDecorators(): void;
  forceReRender(): void;
  raw: () => any; // todo add type
  load: (...args: any[]) => void;
  app: App;
}

const api = start(renderToDOM, { decorateStory });

export const storiesOf: ClientApi['storiesOf'] = (kind, m) => {
  return (api.clientApi.storiesOf(kind, m) as ReturnType<ClientApi['storiesOf']>).addParameters({
    framework,
  });
};

export const configure: ClientApi['configure'] = (...args) => api.configure(framework, ...args);
export const { addDecorator } = api.clientApi;
export const { addParameters } = api.clientApi;
export const { clearDecorators } = api.clientApi;
export const { setAddon } = api.clientApi;
export const { forceReRender } = api;
export const { getStorybook } = api.clientApi;
export const { raw } = api.clientApi;
export const app: ClientApi['app'] = storybookApp;
export { activeStoryComponent } from './render';
