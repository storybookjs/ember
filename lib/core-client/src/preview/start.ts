import global from 'global';
import { ClientApi } from '@storybook/client-api';
import { WebProjectAnnotations, PreviewWeb } from '@storybook/preview-web';
import { AnyFramework, ArgsStoryFn } from '@storybook/csf';
import createChannel from '@storybook/channel-postmessage';
import { addons } from '@storybook/addons';
import Events from '@storybook/core-events';
import { Path } from '@storybook/store';

import { Loadable } from './types';
import { executeLoadableForChanges } from './executeLoadable';

const { window: globalWindow } = global;

export function start<TFramework extends AnyFramework>(
  renderToDOM: WebProjectAnnotations<TFramework>['renderToDOM'],
  {
    decorateStory,
    render,
  }: {
    decorateStory?: WebProjectAnnotations<TFramework>['applyDecorators'];
    render?: ArgsStoryFn<TFramework>;
  } = {}
) {
  const channel = createChannel({ page: 'preview' });
  addons.setChannel(channel);

  let preview: PreviewWeb<TFramework>;
  const clientApi = new ClientApi<TFramework>();

  if (globalWindow) {
    globalWindow.__STORYBOOK_CLIENT_API__ = clientApi;
    globalWindow.__STORYBOOK_ADDONS_CHANNEL__ = channel;
  }

  return {
    forceReRender: () => channel.emit(Events.FORCE_RE_RENDER),
    getStorybook: (): void[] => [],
    raw: (): void => {},

    clientApi,
    // This gets called each time the user calls configure (i.e. once per HMR)
    // The first time, it constructs the preview, subsequently it updates it
    configure(framework: string, loadable: Loadable, m?: NodeModule) {
      clientApi.addParameters({ framework });

      // We need to run the `executeLoadableForChanges` function *inside* the `getProjectAnnotations
      // function in case it throws. So we also need to process its output there also
      const getProjectAnnotations = () => {
        const { added, removed } = executeLoadableForChanges(loadable, m);

        Array.from(added.entries()).forEach(([fileName, fileExports]) =>
          clientApi.addStoriesFromExports(fileName, fileExports)
        );

        Array.from(removed.entries()).forEach(([fileName]) =>
          clientApi.clearFilenameExports(fileName)
        );

        return {
          ...clientApi.projectAnnotations,
          render,
          renderToDOM,
          applyDecorators: decorateStory,
        };
      };

      if (!preview) {
        preview = new PreviewWeb({
          importFn: (path: Path) => clientApi.importFn(path),
          getProjectAnnotations,
          fetchStoriesList: () => clientApi.getStoriesList(),
        });
        if (globalWindow) {
          // eslint-disable-next-line no-underscore-dangle
          globalWindow.__STORYBOOK_PREVIEW__ = preview;
          globalWindow.__STORYBOOK_STORY_STORE__ = preview.storyStore;
        }

        // These two bits are a bit ugly, but due to dependencies, `ClientApi` cannot have
        // direct reference to `PreviewWeb`, so we need to patch in bits
        clientApi.onImportFnChanged = preview.onImportFnChanged.bind(preview);
        clientApi.storyStore = preview.storyStore;

        preview.initializeSync({ cacheAllCSFFiles: true });
      } else {
        getProjectAnnotations();
        preview.onImportFnChanged({ importFn: (path: Path) => clientApi.importFn(path) });
      }
    },
  };
}
