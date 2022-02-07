/* eslint-disable no-underscore-dangle */
import dedent from 'ts-dedent';
import Vue from 'vue';
import { RenderContext } from '@storybook/store';
import { ArgsStoryFn } from '@storybook/csf';
import { VueFramework } from './types-6-0';

export const COMPONENT = 'STORYBOOK_COMPONENT';
export const VALUES = 'STORYBOOK_VALUES';

const root = new Vue({
  data() {
    return {
      [COMPONENT]: undefined,
      [VALUES]: {},
    };
  },
  render(h) {
    const children = this[COMPONENT] ? [h(this[COMPONENT])] : undefined;
    return h('div', { attrs: { id: 'root' } }, children);
  },
});

export const render: ArgsStoryFn<VueFramework> = (props, context) => {
  const { id, component: Component } = context;
  const component = Component as VueFramework['component'] & {
    __docgenInfo?: { displayName: string };
    props: Record<string, any>;
  };

  if (!component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }

  let componentName = 'component';

  // if there is a name property, we either use it or preprend with sb- in case it's an invalid name
  if (component.name) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore isReservedTag is an internal function from Vue, might be changed in future releases
    const isReservedTag = Vue.config.isReservedTag && Vue.config.isReservedTag(component.name);

    componentName = isReservedTag ? `sb-${component.name}` : component.name;
  } else if (component.__docgenInfo?.displayName) {
    // otherwise, we use the displayName from docgen, if present
    componentName = component.__docgenInfo?.displayName;
  }

  return {
    props: component.props,
    components: { [componentName]: component },
    template: `<${componentName} v-bind="$props" />`,
  };
};

export function renderToDOM(
  {
    title,
    name,
    storyFn,
    storyContext: { args },
    showMain,
    showError,
    showException,
    forceRemount,
  }: RenderContext<VueFramework>,
  domElement: HTMLElement
) {
  Vue.config.errorHandler = showException;

  // FIXME: move this into root[COMPONENT] = element
  // once we get rid of knobs so we don't have to re-create
  // a new component each time
  const element = storyFn();

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

  // at component creation || refresh by HMR or switching stories
  if (!root[COMPONENT] || forceRemount) {
    root[COMPONENT] = element;
  }

  // @ts-ignore https://github.com/storybookjs/storrybook/pull/7578#discussion_r307986139
  root[VALUES] = { ...element.options[VALUES], ...args };

  if (!root.$el) {
    root.$mount(domElement);
  }
}
