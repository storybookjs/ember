import { start } from '@storybook/core/client';
import { ClientStoryApi, Loadable } from '@storybook/addons';

import './globals';
import { renderToDOM, render } from './render';
import { IStorybookSection, ServerFramework } from './types';

const framework = 'server';

interface ClientApi extends ClientStoryApi<ServerFramework['storyResult']> {
  setAddon(addon: any): void;
  configure(loader: Loadable, module: NodeModule): void;
  getStorybook(): IStorybookSection[];
  clearDecorators(): void;
  forceReRender(): void;
  raw: () => any; // todo add type
}

const api = start(renderToDOM, { render });

export const storiesOf: ClientApi['storiesOf'] = (kind, m) => {
  return (api.clientApi.storiesOf(kind, m) as ReturnType<ClientApi['storiesOf']>).addParameters({
    framework,
  });
};

export const configure: ClientApi['configure'] = (...args) => api.configure(framework, ...args);
export const { addDecorator, addParameters, clearDecorators, setAddon, getStorybook, raw } =
  api.clientApi;

export const { forceReRender } = api;
