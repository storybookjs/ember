import dedent from 'ts-dedent';

import type { NormalizedStoriesSpecifier } from '../types';

export function toImportFnPart(specifier: NormalizedStoriesSpecifier) {
  const { directory, importPathMatcher } = specifier;

  // It appears webpack passes *something* similar to the absolute path to the file
  // on disk (prefixed with something unknown) to the matcher.
  // We don't want to include the absolute path in our bundle, so we will just pull the
  // '^' and any leading '.' off the regexp and match on that.
  // It's imperfect as it could match extra things in extremely unusual cases, but it'll do for now.
  const webpackIncludeRegex = new RegExp(importPathMatcher.source.replace(/^\^\\\.*/, ''));

  return dedent`
      async (path) => {
        if (!${importPathMatcher}.exec(path)) {
          return;
        }

        const pathRemainder = path.substring(${directory.length + 1});
        return import(
          /* webpackInclude: ${webpackIncludeRegex} */
          '${directory}/' + pathRemainder
        );
      }

  `;
}

export function toImportFn(stories: NormalizedStoriesSpecifier[]) {
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
