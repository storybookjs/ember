import { logger } from '@storybook/client-logger';
import { ModuleExports } from '@storybook/store';
import { Loadable, RequireContext, LoaderFunction } from './types';

/**
 * Executes a Loadable (function that returns exports or require context(s))
 * and returns a map of filename => module exports
 *
 * @param loadable Loadable
 * @returns Map<string, ModuleExports>
 */
export function executeLoadable(loadable: Loadable) {
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
