import { start } from '@storybook/core';

import './globals';
import { renderToDOM } from './render';

const { configure: coreConfigure, clientApi, forceReRender } = start(renderToDOM);

export const { setAddon, addDecorator, addParameters, clearDecorators, getStorybook, raw } =
  clientApi;

const framework = 'ember';
export const storiesOf = (kind: string, m: any) =>
  clientApi.storiesOf(kind, m).addParameters({ framework });
export const configure = (loadable: any, m: any) => coreConfigure(framework, loadable, m);

export { forceReRender };
