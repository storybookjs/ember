import { ClientApi } from '@storybook/client-api';
import { WebPreview } from '@storybook/web-preview';
import { Framework } from '@storybook/csf';
import { Loadable } from './types';

export function start<TFramework extends Framework>() {
  const clientApi = new ClientApi<TFramework>();
  let preview: WebPreview<TFramework>;

  return {
    // TODO
    // forceReRender: () => preview.forceReRender(),
    clientApi,
    configure(loadable: Loadable) {
      const getGlobalAnnotations = () => {
        // TODO
        // clientApi.resetGlobalAnnotations();
        // TODO
        // const exports = runLoadable(loadable)
        return clientApi.globalAnnotations;
      };

      preview = new WebPreview({
        importFn: (path) => clientApi.importFn(path),
        getGlobalAnnotations,
        fetchStoriesList: async () => clientApi.storiesList,
      });

      // m.accept(() => { preview.onGlobalAnnotationsChanged() });
      // clientApi.onImportFnChanged = () => preview.onImportFnChanged();

      // TODO
      preview.initialize().then(() => console.log('init!'));
    },
  };
}
