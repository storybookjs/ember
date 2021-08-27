import ClientApi, {
  addDecorator,
  addParameters,
  addLoader,
  addArgsEnhancer,
  addArgTypesEnhancer,
  setGlobalRender,
  getGlobalRender,
} from './client_api';

import { simulatePageLoad, simulateDOMContentLoaded } from './simulate-pageload';

import { getQueryParams, getQueryParam } from './queryparams';

export * from '@storybook/store';

export {
  addArgsEnhancer,
  addArgTypesEnhancer,
  addDecorator,
  addLoader,
  addParameters,
  setGlobalRender,
  getGlobalRender,
  ClientApi,
  // TODO -- back compat?
  // ConfigApi,
  // TODO -- keep for back-compat?
  getQueryParam,
  getQueryParams,
  // Now in lib/store/UrlStore - TODO - rexport for back-compat?
  // pathToId,
  // TODO -- move somewhere appropriate (utils for app layers)
  simulateDOMContentLoaded,
  simulatePageLoad,
};
