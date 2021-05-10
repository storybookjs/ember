import { document } from 'global';
import dedent from 'ts-dedent';
import { render } from 'lit';
import { isTemplateResult } from 'lit/directive-helpers.js';
import { RenderContext } from './types';

const rootElement = document.getElementById('root');

export default function renderMain({ storyFn, kind, name, showMain, showError }: RenderContext) {
  const element = storyFn();

  showMain();

  if (isTemplateResult(element)) {
    render(element, rootElement);
  } else {
    showError({
      title: `Expecting an lit template result from the story: "${name}" of "${kind}".`,
      description: dedent`
        Did you forget to return the lit template result from the story?
        Use "() => html\`<your snippet or node>\`" or when defining the story.
      `,
    });
  }
}
