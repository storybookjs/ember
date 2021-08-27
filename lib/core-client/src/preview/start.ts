import { ClientApi, RenderContext } from '@storybook/client-api';
import { WebGlobalAnnotations, WebPreview } from '@storybook/web-preview';
import { Framework } from '@storybook/csf';
import { Loadable } from './types';

export function start<TFramework extends Framework>(
  render: WebGlobalAnnotations<TFramework>['renderToDOM'],
  { decorateStory }: { decorateStory?: WebGlobalAnnotations<TFramework>['applyDecorators'] } = {}
) {
  const clientApi = new ClientApi<TFramework>();
  let preview: WebPreview<TFramework>;

  return {
    // TODO
    // forceReRender: () => preview.forceReRender(),
    forceReRender: (): void => {},
    getStorybook: (): void[] => [],
    raw: (): void => {},

    clientApi,
    configure(framework: string, loadable: Loadable, m: NodeModule) {
      const getGlobalAnnotations = () => {
        // TODO
        // clientApi.resetGlobalAnnotations();
        // TODO
        // const exports = runLoadable(loadable)
        return {
          ...clientApi.globalAnnotations,
          renderToDOM: render,
          applyDecorators: decorateStory,
        };
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
