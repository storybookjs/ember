import global from 'global';
import { ArgsStoryFn } from '@storybook/csf';
import { RenderContext } from '@storybook/store';
import { SvelteFramework } from './types';
import PreviewRender from './PreviewRender.svelte';

const { document } = global;

let previousComponent: SvelteFramework['component'] = null;

function cleanUpPreviousStory() {
  if (!previousComponent) {
    return;
  }
  previousComponent.$destroy();
  previousComponent = null;
}

export function renderToDOM(
  { storyFn, kind, name, showMain, showError }: RenderContext<SvelteFramework>,
  domElement: HTMLElement
) {
  cleanUpPreviousStory();

  const target = document.getElementById('root');

  target.innerHTML = '';

  previousComponent = new PreviewRender({
    target,
    props: {
      storyFn,
      name,
      kind,
      showError,
    },
  });

  showMain();
}

export const render: ArgsStoryFn<SvelteFramework> = (args, context) => {
  const { id, component: Component } = context;
  if (!Component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }

  return { Component, props: args };
};
