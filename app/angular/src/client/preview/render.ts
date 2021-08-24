import { RenderContext } from '@storybook/store';

import { renderNgApp } from './angular/helpers';
import { AngularFramework } from './types-6-0';

import { RendererFactory } from './angular-beta/RendererFactory';

export const rendererFactory = new RendererFactory();

export default async function renderMain(
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
    parameters: { ...parameters, component },
    forced: !forceRemount,
    targetDOMNode: element,
  });
}
