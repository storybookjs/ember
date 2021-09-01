import global from 'global';
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

// TODO -- what is the type of storyFn result?
export default function render(
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
