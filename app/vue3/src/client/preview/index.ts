import type { App } from 'vue';
import { start } from '@storybook/core/client';
import { ClientStoryApi, Loadable } from '@storybook/addons';

import './globals';
import { IStorybookSection } from './types';
import { VueFramework } from './types-6-0';
import { decorateStory } from './decorateStory';

import { render, renderToDOM, storybookApp } from './render';

const framework = 'vue3';

interface ClientApi extends ClientStoryApi<VueFramework['storyResult']> {
  setAddon(addon: any): void;
  configure(loader: Loadable, module: NodeModule): void;
  getStorybook(): IStorybookSection[];
  clearDecorators(): void;
  forceReRender(): void;
  raw: () => any; // todo add type
  load: (...args: any[]) => void;
  app: App;
}

const api = start(renderToDOM, { decorateStory, render });

export const storiesOf: ClientApi['storiesOf'] = (kind, m) => {
  return (api.clientApi.storiesOf(kind, m) as ReturnType<ClientApi['storiesOf']>).addParameters({
    framework,
  });
};

export const configure: ClientApi['configure'] = (...args) => api.configure(framework, ...args);
export const { addDecorator } = api.clientApi;
export const { addParameters } = api.clientApi;
export const { clearDecorators } = api.clientApi;
export const { setAddon } = api.clientApi;
export const { forceReRender } = api;
export const { getStorybook } = api.clientApi;
export const { raw } = api.clientApi;
export const app: ClientApi['app'] = storybookApp;
export { activeStoryComponent } from './render';
