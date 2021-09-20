import dedent from 'ts-dedent';
import { createApp, h, shallowRef, ComponentPublicInstance } from 'vue';
import { RenderContext } from '@storybook/store';
import { StoryFnVueReturnType } from './types';
import { VueFramework } from './types-6-0';

const activeStoryComponent = shallowRef<StoryFnVueReturnType | null>(null);

let root: ComponentPublicInstance | null = null;

export const storybookApp = createApp({
  // If an end-user calls `unmount` on the app, we need to clear our root variable
  unmounted() {
    root = null;
  },

  setup() {
    return () => {
      if (!activeStoryComponent.value)
        throw new Error('No Vue 3 Story available. Was it set correctly?');
      return h(activeStoryComponent.value);
    };
  },
});

export function renderToDOM(
  { title, name, storyFn, showMain, showError, showException }: RenderContext<VueFramework>,
  domElement: HTMLElement
) {
  storybookApp.config.errorHandler = showException;

  const element: StoryFnVueReturnType = storyFn();

  if (!element) {
    showError({
      title: `Expecting a Vue component from the story: "${name}" of "${title}".`,
      description: dedent`
        Did you forget to return the Vue component from the story?
        Use "() => ({ template: '<my-comp></my-comp>' })" or "() => ({ components: MyComp, template: '<my-comp></my-comp>' })" when defining the story.
      `,
    });
    return;
  }

  showMain();

  activeStoryComponent.value = element;

  if (!root) {
    root = storybookApp.mount(domElement);
  }
}
