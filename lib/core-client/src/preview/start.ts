import { ClientApi } from '@storybook/client-api';
import { WebGlobalAnnotations, WebPreview } from '@storybook/web-preview';
import { Framework } from '@storybook/csf';
import createChannel from '@storybook/channel-postmessage';
import { addons } from '@storybook/addons';
import Events from '@storybook/core-events';
import { Path } from '@storybook/store';

import { Loadable } from './types';
import { executeLoadable } from './executeLoadable';

export function start<TFramework extends Framework>(
  render: WebGlobalAnnotations<TFramework>['renderToDOM'],
  { decorateStory }: { decorateStory?: WebGlobalAnnotations<TFramework>['applyDecorators'] } = {}
) {
  const channel = createChannel({ page: 'preview' });
  addons.setChannel(channel);

  const clientApi = new ClientApi<TFramework>();
  let preview: WebPreview<TFramework>;

  return {
    forceReRender: () => channel.emit(Events.FORCE_RE_RENDER),
    getStorybook: (): void[] => [],
    raw: (): void => {},

    clientApi,
    configure(framework: string, loadable: Loadable, m?: NodeModule) {
      let lastExportsMap: ReturnType<typeof executeLoadable> =
        m?.hot?.data?.lastExportsMap || new Map();
      if (m?.hot?.dispose) {
        m.hot.accept();
        m.hot.dispose((data) => {
          // eslint-disable-next-line no-param-reassign
          data.lastExportsMap = lastExportsMap;
        });
      }

      clientApi.addParameters({ framework });

      const getGlobalAnnotations = () => {
        const exportsMap = executeLoadable(loadable);
        Array.from(exportsMap.entries())
          .filter(([, fileExports]) => !!fileExports.default)
          .forEach(([fileName, fileExports]) => {
            // Exports haven't changed so there is so no need to do anything
            if (lastExportsMap.get(fileName) === fileExports) {
              return;
            }

            clientApi.addStoriesFromExports(fileName, fileExports);
          });
        Array.from(lastExportsMap.keys())
          .filter((fileName) => !exportsMap.has(fileName))
          .forEach((fileName) => clientApi.clearFilenameExports(fileName));
        lastExportsMap = exportsMap;

        return {
          ...clientApi.globalAnnotations,
          renderToDOM: render,
          applyDecorators: decorateStory,
        };
      };
      if (!preview) {
        preview = new WebPreview({
          importFn: (path: Path) => clientApi.importFn(path),
          getGlobalAnnotations,
          fetchStoriesList: async () => clientApi.getStoriesList(),
        });
        clientApi.onImportFnChanged = preview.onImportFnChanged.bind(preview);

        // TODO
        preview
          .initialize()
          .then(() => console.log('init!'))
          .catch((err) => console.error(err));
      } else {
        getGlobalAnnotations();
        preview.onImportFnChanged({ importFn: clientApi.importFn.bind(clientApi) });
      }
    },
  };
}
