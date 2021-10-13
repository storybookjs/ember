import global from 'global';
import { RenderContext, noTargetArgs } from '@storybook/store';
import { ArgsStoryFn } from '@storybook/csf';

import { renderNgApp } from './angular/helpers';
import { AngularFramework } from './types-6-0';

import { RendererFactory } from './angular-beta/RendererFactory';

const { FEATURES } = global;

export const rendererFactory = new RendererFactory();

export const render: ArgsStoryFn<AngularFramework> = (args, context) => {
  const renderedArgs = FEATURES.argTypeTarget ? noTargetArgs(context) : args;

  return { props: renderedArgs };
};

export async function renderToDOM(
  {
    storyFn,
    showMain,
    forceRemount,
    storyContext: { parameters, component },
    id,
  }: RenderContext<AngularFramework>,
  element: HTMLElement
) {
  showMain();

  if (parameters.angularLegacyRendering) {
    renderNgApp(storyFn, !forceRemount);
    return;
  }

  const renderer = await rendererFactory.getRendererInstance(id, element);

  await renderer.render({
    storyFnAngular: storyFn(),
    component,
    parameters,
    forced: !forceRemount,
    targetDOMNode: element,
  });
}
