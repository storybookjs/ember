/* eslint-disable prefer-destructuring */
import { ClientStoryApi, Loadable } from '@storybook/addons';
import { RenderStoryFunction, start } from '@storybook/core/client';
import decorateStory from './decorateStory';
import './globals';
import render from './render';
import { IStorybookSection, StoryFnAngularReturnType } from './types';
import { Story } from './types-6-0';

const framework = 'angular';

interface ClientApi extends ClientStoryApi<StoryFnAngularReturnType> {
  setAddon(addon: any): void;
  configure(loader: Loadable, module: NodeModule): void;
  getStorybook(): IStorybookSection[];
  clearDecorators(): void;
  forceReRender(): void;
  raw: () => any; // todo add type
  load: (...args: any[]) => void;
}

const globalRender: Story = (props) => ({ props });

const api = start((render as any) as RenderStoryFunction, { decorateStory });

api.clientApi.globalRender = globalRender;
export const storiesOf: ClientApi['storiesOf'] = (kind, m) => {
  return (api.clientApi.storiesOf(kind, m) as ReturnType<ClientApi['storiesOf']>).addParameters({
    framework,
  });
};

export const configure: ClientApi['configure'] = (...args) => api.configure(framework, ...args);
export const addDecorator: ClientApi['addDecorator'] = api.clientApi
  .addDecorator as ClientApi['addDecorator'];
export const addParameters: ClientApi['addParameters'] = api.clientApi
  .addParameters as ClientApi['addParameters'];
export const clearDecorators: ClientApi['clearDecorators'] = api.clientApi.clearDecorators;
export const setAddon: ClientApi['setAddon'] = api.clientApi.setAddon;
export const forceReRender: ClientApi['forceReRender'] = api.forceReRender;
export const getStorybook: ClientApi['getStorybook'] = api.clientApi.getStorybook;
export const raw: ClientApi['raw'] = api.clientApi.raw;
