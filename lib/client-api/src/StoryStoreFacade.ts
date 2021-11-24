import global from 'global';
import dedent from 'ts-dedent';
import { SynchronousPromise } from 'synchronous-promise';
import {
  StoryId,
  AnyFramework,
  toId,
  isExportStory,
  Parameters,
  StoryFn,
  storyNameFromExport,
} from '@storybook/csf';
import {
  NormalizedProjectAnnotations,
  NormalizedStoriesSpecifier,
  Path,
  StoryIndex,
  ModuleExports,
  StoryStore,
  Story,
  autoTitle,
  sortStoriesV6,
  StoryIndexEntry,
} from '@storybook/store';
import { logger } from '@storybook/client-logger';

export interface GetStorybookStory<TFramework extends AnyFramework> {
  name: string;
  render: StoryFn<TFramework>;
}

export interface GetStorybookKind<TFramework extends AnyFramework> {
  kind: string;
  fileName: string;
  stories: GetStorybookStory<TFramework>[];
}

export class StoryStoreFacade<TFramework extends AnyFramework> {
  projectAnnotations: NormalizedProjectAnnotations<TFramework>;

  stories: StoryIndex['stories'];

  csfExports: Record<Path, ModuleExports>;

  constructor() {
    this.projectAnnotations = {
      loaders: [],
      decorators: [],
      parameters: {},
      argsEnhancers: [],
      argTypesEnhancers: [],
    };

    this.stories = {};

    this.csfExports = {};
  }

  // This doesn't actually import anything because the client-api loads fully
  // on startup, but this is a shim after all.
  importFn(path: Path) {
    return SynchronousPromise.resolve().then(() => {
      const moduleExports = this.csfExports[path];
      if (!moduleExports) throw new Error(`Unknown path: ${path}`);
      return moduleExports;
    });
  }

  getStoryIndex(store: StoryStore<TFramework>) {
    const fileNameOrder = Object.keys(this.csfExports);
    const storySortParameter = this.projectAnnotations.parameters?.options?.storySort;

    const storyEntries = Object.entries(this.stories);
    // Add the kind parameters and global parameters to each entry
    const sortableV6: [StoryId, Story<TFramework>, Parameters, Parameters][] = storyEntries.map(
      ([storyId, { importPath }]) => {
        const exports = this.csfExports[importPath];
        const csfFile = store.processCSFFileWithCache<TFramework>(
          exports,
          importPath,
          exports.default.title
        );
        return [
          storyId,
          store.storyFromCSFFile({ storyId, csfFile }),
          csfFile.meta.parameters,
          this.projectAnnotations.parameters,
        ];
      }
    );

    // NOTE: the sortStoriesV6 version returns the v7 data format. confusing but more convenient!
    let sortedV7: StoryIndexEntry[];

    try {
      sortedV7 = sortStoriesV6(sortableV6, storySortParameter, fileNameOrder);
    } catch (err) {
      if (typeof storySortParameter === 'function') {
        throw new Error(dedent`
          Error sorting stories with sort parameter ${storySortParameter}:

          > ${err.message}
          
          Are you using a V7-style sort function in V6 compatibility mode?
          
          More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#v7-style-story-sort
        `);
      }
      throw err;
    }
    const stories = sortedV7.reduce((acc, s) => {
      // We use the original entry we stored in `this.stories` because it is possible that the CSF file itself
      // exports a `parameters.fileName` which can be different and mess up our `importFn`.
      // In fact, in Storyshots there is a Jest transformer that does exactly that.
      // NOTE: this doesn't actually change the story object, just the index.
      acc[s.id] = this.stories[s.id];
      return acc;
    }, {} as StoryIndex['stories']);

    return { v: 3, stories };
  }

  clearFilenameExports(fileName: Path) {
    if (!this.csfExports[fileName]) {
      return;
    }

    // Clear this module's stories from the storyList and existing exports
    Object.entries(this.stories).forEach(([id, { importPath }]) => {
      if (importPath === fileName) {
        delete this.stories[id];
      }
    });

    // We keep this as an empty record so we can use it to maintain component order
    this.csfExports[fileName] = {};
  }

  // NOTE: we could potentially share some of this code with the stories.json generation
  addStoriesFromExports(fileName: Path, fileExports: ModuleExports) {
    // if the export haven't changed since last time we added them, this is a no-op
    if (this.csfExports[fileName] === fileExports) {
      return;
    }
    // OTOH, if they have changed, let's clear them out first
    this.clearFilenameExports(fileName);

    const { default: defaultExport, __namedExportsOrder, ...namedExports } = fileExports;
    // eslint-disable-next-line prefer-const
    let { id: componentId, title } = defaultExport || {};

    title =
      title ||
      autoTitle(
        fileName,
        (global.STORIES || []).map(
          (specifier: NormalizedStoriesSpecifier & { importPathMatcher: string }) => ({
            ...specifier,
            importPathMatcher: new RegExp(specifier.importPathMatcher),
          })
        )
      );
    if (!title) {
      logger.info(
        `Unexpected default export without title in '${fileName}': ${JSON.stringify(
          fileExports.default
        )}`
      );
      return;
    }

    this.csfExports[fileName] = {
      ...fileExports,
      default: { ...defaultExport, title },
    };

    let sortedExports = namedExports;

    // prefer a user/loader provided `__namedExportsOrder` array if supplied
    // we do this as es module exports are always ordered alphabetically
    // see https://github.com/storybookjs/storybook/issues/9136
    if (Array.isArray(__namedExportsOrder)) {
      sortedExports = {};
      __namedExportsOrder.forEach((name) => {
        const namedExport = namedExports[name];
        if (namedExport) sortedExports[name] = namedExport;
      });
    }

    Object.entries(sortedExports)
      .filter(([key]) => isExportStory(key, defaultExport))
      .forEach(([key, storyExport]: [string, any]) => {
        const exportName = storyNameFromExport(key);
        const id = storyExport.parameters?.__id || toId(componentId || title, exportName);
        const name =
          (typeof storyExport !== 'function' && storyExport.name) ||
          storyExport.storyName ||
          storyExport.story?.name ||
          exportName;

        this.stories[id] = {
          id,
          name,
          title,
          importPath: fileName,
        };
      });
  }
}
