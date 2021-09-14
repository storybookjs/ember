import dedent from 'ts-dedent';
import { toRequireContext } from '..';

import type { NormalizedStoriesEntry } from '../types';

export function toImportFnPart(entry: NormalizedStoriesEntry) {
  const { path: base, regex } = toRequireContext(entry.glob);

  const webpackIncludeRegex = new RegExp(regex.source.substring(1));

  // NOTE: `base` looks like './src' but `path`, (and what micromatch expects)
  // is something that starts with `src/`. So to strip off base from path, we
  // need to drop `base.length - 1` chars.
  return dedent`
      async (path) => {
        if (!${regex}.exec(path)) {
          return;
        }
        const remainder = path.substring(${base.length - 1});
        return import(
          /* webpackInclude: ${webpackIncludeRegex} */
          '${base}/' + remainder
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
