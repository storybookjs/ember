import { Framework } from '@storybook/csf';
import { ClientStoryApi, Loadable } from '@storybook/addons';
import { ClientApi as ClientApiThing } from '@storybook/client-api';
import { StoryshotsOptions } from '../api/StoryshotsOptions';
import { SupportedFramework } from './SupportedFramework';

export type RenderTree = (story: any, context?: any, options?: any) => any;

export interface ClientApi<TFramework extends Framework> extends ClientStoryApi<TFramework> {
  configure(loader: Loadable, module: NodeModule | false, showDeprecationWarning?: boolean): void;
  forceReRender(): void;
  clearDecorators: ClientApiThing<TFramework>['clearDecorators'];
  getStorybook: ClientApiThing<TFramework>['getStorybook'];
  setAddon: ClientApiThing<TFramework>['setAddon'];
  raw: ClientApiThing<TFramework>['raw'];
  addArgsEnhancer: ClientApiThing<TFramework>['addArgsEnhancer'];
  addArgTypesEnhancer: ClientApiThing<TFramework>['addArgTypesEnhancer'];
}

// TODO -- this is untyped for now, we could import each framework's Framework type
export interface Loader {
  load: (
    options: StoryshotsOptions
  ) => {
    framework: SupportedFramework;
    renderTree: RenderTree;
    renderShallowTree: any;
    storybook: ClientApi<Framework>;
  };
  test: (options: StoryshotsOptions) => boolean;
}
