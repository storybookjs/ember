import { ClientApi } from '@storybook/client-api';
import { WebGlobalAnnotations, WebPreview } from '@storybook/web-preview';
import { Framework, toId, storyNameFromExport } from '@storybook/csf';
import { logger } from '@storybook/client-logger';
import createChannel from '@storybook/channel-postmessage';
import { addons } from '@storybook/addons';
import Events from '@storybook/core-events';
import { Path, ModuleExports } from '@storybook/store';

import { Loadable, RequireContext, LoaderFunction } from './types';

function runLoadable(loadable: Loadable) {
  let reqs = null;
  // todo discuss / improve type check
  if (Array.isArray(loadable)) {
    reqs = loadable;
  } else if ((loadable as RequireContext).keys) {
    reqs = [loadable as RequireContext];
  }

  let exportsMap = new Map<string, ModuleExports>();
  if (reqs) {
    reqs.forEach((req) => {
      req.keys().forEach((filename: string) => {
        try {
          const fileExports = req(filename) as ModuleExports;
          exportsMap.set(
            typeof req.resolve === 'function' ? req.resolve(filename) : filename,
            fileExports
          );
        } catch (error) {
          logger.warn(`Unexpected error while loading ${filename}: ${error}`);
        }
      });
    });
  } else {
    const exported = (loadable as LoaderFunction)();
    if (Array.isArray(exported) && exported.every((obj) => obj.default != null)) {
      exportsMap = new Map(
        exported.map((fileExports, index) => [`exports-map-${index}`, fileExports])
      );
    } else if (exported) {
      logger.warn(
        `Loader function passed to 'configure' should return void or an array of module exports that all contain a 'default' export. Received: ${JSON.stringify(
          exported
        )}`
      );
    }
  }

  return exportsMap;
}

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
    // TODO -- add framework to globalAnnotations.parameters?
    configure(framework: string, loadable: Loadable, m?: NodeModule) {
      const getGlobalAnnotations = () => {
        // TODO
        // clientApi.resetGlobalAnnotations();

        const exportsMap = runLoadable(loadable);
        Array.from(exportsMap.entries())
          .filter(([, fileExports]) => !!fileExports.default)
          .forEach(([fileName, fileExports]) => {
            const { default: defaultExport, __namedExportsOrder, ...namedExports } = fileExports;
            const { title } = defaultExport || {};
            if (!title) {
              throw new Error(
                `Unexpected default export without title: ${JSON.stringify(fileExports.default)}`
              );
            }

            clientApi.csfExports[fileName] = fileExports;

            let exports = namedExports;
            if (Array.isArray(__namedExportsOrder)) {
              exports = {};
              __namedExportsOrder.forEach((name) => {
                if (namedExports[name]) {
                  exports[name] = namedExports[name];
                }
              });
            }
            Object.entries(exports).forEach(([key, storyExport]: [string, any]) => {
              const actualName: string =
                (typeof storyExport !== 'function' && storyExport.name) ||
                storyExport.storyName ||
                storyExport.story?.name ||
                storyNameFromExport(key);
              // eslint-disable-next-line no-underscore-dangle
              const id = storyExport.parameters?.__id || toId(title, actualName);
              clientApi.storiesList.stories[id] = {
                name: actualName,
                title,
                importPath: fileName,
              };
            });
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
