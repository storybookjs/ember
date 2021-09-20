import stable from 'stable';
import global from 'global';
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
  Path,
  StoryIndex,
  ModuleExports,
  StoryStore,
  Story,
  autoTitle,
} from '@storybook/store';
import { Comparator } from '@storybook/addons';

import { storySort } from './storySort';

const { STORIES = [] } = global;

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
    return this.csfExports[path];
  }

  fetchStoryIndex(store: StoryStore<TFramework>) {
    const fileNameOrder = Object.keys(this.csfExports);
    const storySortParameter = this.projectAnnotations.parameters?.options?.storySort;

    const storyEntries = Object.entries(this.stories);
    // Add the kind parameters and global parameters to each entry
    const stories: [StoryId, Story<TFramework>, Parameters, Parameters][] = storyEntries.map(
      ([storyId, { importPath }]) => {
        const exports = this.csfExports[importPath];
        const csfFile = store.processCSFFileWithCache<TFramework>(exports, exports.default.title);
        return [
          storyId,
          store.storyFromCSFFile({ storyId, csfFile }),
          csfFile.meta.parameters,
          this.projectAnnotations.parameters,
        ];
      }
    );

    if (storySortParameter) {
      let sortFn: Comparator<any>;
      if (typeof storySortParameter === 'function') {
        sortFn = storySortParameter;
      } else {
        sortFn = storySort(storySortParameter);
      }
      stable.inplace(stories, sortFn);
    } else {
      stable.inplace(
        stories,
        (s1, s2) =>
          fileNameOrder.indexOf(s1[1].parameters.fileName) -
          fileNameOrder.indexOf(s2[1].parameters.fileName)
      );
    }

    return {
      v: 3,
      stories: stories.reduce((acc, [id]) => {
        acc[id] = this.stories[id];
        return acc;
      }, {} as StoryIndex['stories']),
    };
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

    title = title || autoTitle(fileName, STORIES);
    if (!title) {
      throw new Error(
        `Unexpected default export without title in '${fileName}': ${JSON.stringify(
          fileExports.default
        )}`
      );
    }

    this.csfExports[fileName] = {
      ...fileExports,
      default: {
        ...defaultExport,
        title,
        parameters: {
          fileName,
          ...defaultExport.parameters,
        },
      },
    };

    Object.entries(namedExports)
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
          name,
          title,
          importPath: fileName,
        };
      });
  }
}
