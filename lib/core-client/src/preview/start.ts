import { ClientApi, ModuleExports } from '@storybook/client-api';
import { WebGlobalAnnotations, WebPreview } from '@storybook/web-preview';
import { Framework, toId, storyNameFromExport } from '@storybook/csf';
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
      clientApi.addParameters({ framework });

      const getGlobalAnnotations = () => {
        // TODO
        // clientApi.resetGlobalAnnotations();

        const exportsMap = executeLoadable(loadable);
        Array.from(exportsMap.entries())
          .filter(([, fileExports]) => !!fileExports.default)
          .forEach(([fileName, fileExports]) => {
            clientApi.addStoriesFromExports(fileName, fileExports);
          });

        return {
          ...clientApi.globalAnnotations,
          renderToDOM: render,
          applyDecorators: decorateStory,
        };
      };

      preview = new WebPreview({
        importFn: (path: Path) => clientApi.importFn(path),
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
