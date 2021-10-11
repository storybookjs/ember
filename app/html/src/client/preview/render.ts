/* eslint-disable no-param-reassign */
import global from 'global';
import dedent from 'ts-dedent';
import { simulatePageLoad, simulateDOMContentLoaded } from '@storybook/preview-web';
import { RenderContext } from '@storybook/store';
import { HtmlFramework } from './types-6-0';

const { Node } = global;

export function renderToDOM(
  { storyFn, kind, name, showMain, showError, forceRemount }: RenderContext<HtmlFramework>,
  domElement: HTMLElement
) {
  const element = storyFn();
  showMain();
  if (typeof element === 'string') {
    domElement.innerHTML = element;
    simulatePageLoad(domElement);
  } else if (element instanceof Node) {
    if (domElement.firstChild === element && forceRemount === false) {
      return;
    }

    domElement.innerHTML = '';
    domElement.appendChild(element);
    simulateDOMContentLoaded();
  } else {
    showError({
      title: `Expecting an HTML snippet or DOM node from the story: "${name}" of "${kind}".`,
      description: dedent`
        Did you forget to return the HTML snippet from the story?
        Use "() => <your snippet or node>" or when defining the story.
      `,
    });
  }
}
