import * as preact from 'preact';
import dedent from 'ts-dedent';
import { RenderContext } from '@storybook/store';
import { StoryFnPreactReturnType } from './types';
import { PreactFramework } from './types-6-0';

let renderedStory: Element;

function preactRender(story: StoryFnPreactReturnType, domElement: HTMLElement): void {
  if (preact.Fragment) {
    // Preact 10 only:
    preact.render(story, domElement);
  } else {
    renderedStory = preact.render(story, domElement, renderedStory) as unknown as Element;
  }
}

const StoryHarness: preact.FunctionalComponent<{
  name: string;
  title: string;
  showError: RenderContext<PreactFramework>['showError'];
  storyFn: () => any;
  domElement: HTMLElement;
}> = ({ showError, name, title, storyFn, domElement }) => {
  const content = preact.h(storyFn as any, null);
  if (!content) {
    showError({
      title: `Expecting a Preact element from the story: "${name}" of "${title}".`,
      description: dedent`
        Did you forget to return the Preact element from the story?
        Use "() => (<MyComp/>)" or "() => { return <MyComp/>; }" when defining the story.
      `,
    });
    return null;
  }
  return content;
};

export function renderToDOM(
  { storyFn, title, name, showMain, showError, forceRemount }: RenderContext<PreactFramework>,
  domElement: HTMLElement
) {
  if (forceRemount) {
    preactRender(null, domElement);
  }

  showMain();

  preactRender(preact.h(StoryHarness, { name, title, showError, storyFn, domElement }), domElement);
}
