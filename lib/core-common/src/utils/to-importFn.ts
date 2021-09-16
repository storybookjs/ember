import dedent from 'ts-dedent';
import { toRequireContext } from '..';

import type { NormalizedStoriesEntry } from '../types';

export function toImportFnPart(entry: NormalizedStoriesEntry) {
  const { path: base, regex } = toRequireContext(entry.glob);

  const webpackIncludeRegex = new RegExp(regex.source.substring(1));

  return dedent`
      async (path) => {
        const pathBase = path.substring(0, ${base.length + 1});
        if (pathBase !== '${base}/') {
          return;
        }

        const pathRemainder = path.substring(${base.length + 1});
        if (!${regex}.exec(pathRemainder)) {
          return;
        }
        return import(
          /* webpackInclude: ${webpackIncludeRegex} */
          '${base}/' + pathRemainder
        );
      }

  `;
}

export function toImportFn(stories: NormalizedStoriesEntry[]) {
  return dedent`
    const importers = [
      ${stories.map(toImportFnPart).join(',\n')}
    ];

    export async function importFn(path) {
      for (let i = 0; i < importers.length; i++) {
        const moduleExports = await importers[i](path);
        if (moduleExports) {
          return moduleExports;
        }
      }
    }
  `;
}
