import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import { logger } from '@storybook/client-logger';
import {
  Framework,
  toId,
  DecoratorFunction,
  Parameters,
  ArgTypesEnhancer,
  ArgsEnhancer,
  LoaderFunction,
  StoryFn,
  sanitize,
  storyNameFromExport,
  ComponentTitle,
} from '@storybook/csf';
import {
  NormalizedComponentAnnotations,
  NormalizedGlobalAnnotations,
  Path,
  StoriesList,
  ModuleExports,
  ModuleImportFn,
  combineParameters,
  StoryStore,
} from '@storybook/store';

import { ClientApiAddons, StoryApi } from '@storybook/addons';

export interface GetStorybookStory<TFramework extends Framework> {
  name: string;
  render: StoryFn<TFramework>;
}

export interface GetStorybookKind<TFramework extends Framework> {
  kind: string;
  fileName: string;
  stories: GetStorybookStory<TFramework>[];
}

// ClientApi (and StoreStore) are really singletons. However they are not created until the
// relevant framework instanciates them via `start.js`. The good news is this happens right away.
let singleton: ClientApi<Framework>;

const addDecoratorDeprecationWarning = deprecate(
  () => {},
  `\`addDecorator\` is deprecated, and will be removed in Storybook 7.0.
Instead, use \`export const decorators = [];\` in your \`preview.js\`.
Read more at https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-addparameters-and-adddecorator).`
);
export const addDecorator = (
  decorator: DecoratorFunction<Framework>,
  deprecationWarning = true
) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call addDecorator`);

  if (deprecationWarning) addDecoratorDeprecationWarning();

  singleton.addDecorator(decorator);
};

const addParametersDeprecationWarning = deprecate(
  () => {},
  `\`addParameters\` is deprecated, and will be removed in Storybook 7.0.
Instead, use \`export const parameters = {};\` in your \`preview.js\`.
Read more at https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-addparameters-and-adddecorator).`
);
export const addParameters = (parameters: Parameters, deprecationWarning = true) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call addParameters`);

  if (deprecationWarning) addParametersDeprecationWarning();

  singleton.addParameters(parameters);
};

const addLoaderDeprecationWarning = deprecate(
  () => {},
  `\`addLoader\` is deprecated, and will be removed in Storybook 7.0.
Instead, use \`export const loaders = [];\` in your \`preview.js\`.
Read more at https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-addparameters-and-adddecorator).`
);
export const addLoader = (loader: LoaderFunction<Framework>, deprecationWarning = true) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call addParameters`);

  if (deprecationWarning) addLoaderDeprecationWarning();

  singleton.addLoader(loader);
};

export const addArgsEnhancer = (enhancer: ArgsEnhancer<Framework>) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call addArgsEnhancer`);

  singleton.addArgsEnhancer(enhancer);
};

export const addArgTypesEnhancer = (enhancer: ArgTypesEnhancer<Framework>) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call addArgTypesEnhancer`);

  singleton.addArgTypesEnhancer(enhancer);
};

export const getGlobalRender = () => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call getGlobalRender`);

  return singleton.globalAnnotations.render;
};

export const setGlobalRender = (render: StoryFn<Framework>) => {
  if (!singleton)
    throw new Error(`Singleton client API not yet initialized, cannot call setGobalRender`);
  singleton.globalAnnotations.render = render;
};

const invalidStoryTypes = new Set(['string', 'number', 'boolean', 'symbol']);
export default class ClientApi<TFramework extends Framework> {
  globalAnnotations: NormalizedGlobalAnnotations<TFramework>;

  storyStore?: StoryStore<TFramework>;

  onImportFnChanged?: ({ importFn }: { importFn: ModuleImportFn }) => void;

  private stories: StoriesList['stories'];

  private csfExports: Record<Path, ModuleExports>;

  private addons: ClientApiAddons<TFramework>;

  // If we don't get passed modules so don't know filenames, we can
  // just use numeric indexes
  private lastFileName = 0;

  constructor() {
    this.globalAnnotations = {
      loaders: [],
      decorators: [],
      parameters: {},
      argsEnhancers: [],
      argTypesEnhancers: [],
    };

    this.stories = {};

    this.csfExports = {};

    this.addons = {};

    singleton = this;
  }

  // This doesn't actually import anything because the client-api loads fully
  // on startup, but this is a shim after all.
  importFn(path: Path) {
    return this.csfExports[path];
  }

  getStoriesList() {
    const fileNameOrder = Object.keys(this.csfExports);
    const sortedStoryEntries = Object.entries(this.stories).sort(
      ([id1, story1], [id2, story2]) =>
        fileNameOrder.indexOf(story1.importPath) - fileNameOrder.indexOf(story2.importPath)
    );

    return {
      v: 3,
      stories: sortedStoryEntries.reduce((acc, [id, entry]) => {
        acc[id] = entry;
        return acc;
      }, {} as StoriesList['stories']),
    };
  }

  setAddon = deprecate(
    (addon: any) => {
      this.addons = { ...this.addons, ...addon };
    },
    dedent`
      \`setAddon\` is deprecated and will be removed in Storybook 7.0.

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-setaddon
    `
  );

  addDecorator = (decorator: DecoratorFunction<TFramework>) => {
    this.globalAnnotations.decorators.push(decorator);
  };

  clearDecorators = deprecate(
    () => {
      this.globalAnnotations.decorators = [];
    },
    dedent`
      \`clearDecorators\` is deprecated and will be removed in Storybook 7.0.

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-cleardecorators
    `
  );

  addParameters = (parameters: Parameters) => {
    this.globalAnnotations.parameters = combineParameters(
      this.globalAnnotations.parameters,
      parameters
    );
  };

  addLoader = (loader: LoaderFunction<TFramework>) => {
    this.globalAnnotations.loaders.push(loader);
  };

  addArgsEnhancer = (enhancer: ArgsEnhancer<TFramework>) => {
    this.globalAnnotations.argsEnhancers.push(enhancer);
  };

  addArgTypesEnhancer = (enhancer: ArgTypesEnhancer<TFramework>) => {
    this.globalAnnotations.argTypesEnhancers.push(enhancer);
  };

  // what are the occasions that "m" is a boolean vs an obj
  storiesOf = (kind: string, m?: NodeModule): StoryApi<TFramework> => {
    if (!kind && typeof kind !== 'string') {
      throw new Error('Invalid or missing kind provided for stories, should be a string');
    }

    if (!m) {
      logger.warn(
        `Missing 'module' parameter for story with a kind of '${kind}'. It will break your HMR`
      );
    }

    if (m) {
      const proto = Object.getPrototypeOf(m);
      if (proto.exports && proto.exports.default) {
        // FIXME: throw an error in SB6.0
        logger.error(
          `Illegal mix of CSF default export and storiesOf calls in a single file: ${proto.i}`
        );
      }
    }

    // eslint-disable-next-line no-plusplus
    const fileName = m && m.id ? `${m.id}` : (this.lastFileName++).toString();

    if (m && m.hot && m.hot.accept) {
      // This module used storiesOf(), so when it re-runs on HMR, it will reload
      // itself automatically without us needing to look at our imports
      m.hot.accept();
      m.hot.dispose(() => {
        this.clearFilenameExports(fileName);

        // We need to update the importFn as soon as the module re-evaluates
        // (and calls storiesOf() again, etc). We could call `onImportFnChanged()`
        // at the end of every setStories call (somehow), but then we'd need to
        // debounce it somehow for initial startup. Instead, we'll take advantage of
        // the fact that the evaluation of the module happens immediately in the same tick
        setTimeout(() => {
          this.onImportFnChanged?.({ importFn: this.importFn.bind(this) });
        }, 0);
      });
    }

    let hasAdded = false;
    const api: StoryApi<TFramework> = {
      kind: kind.toString(),
      add: () => api,
      addDecorator: () => api,
      addLoader: () => api,
      addParameters: () => api,
    };

    // apply addons
    Object.keys(this.addons).forEach((name) => {
      const addon = this.addons[name];
      api[name] = (...args: any[]) => {
        addon.apply(api, args);
        return api;
      };
    });

    const meta: NormalizedComponentAnnotations<TFramework> = {
      id: sanitize(kind),
      title: kind,
      decorators: [],
      loaders: [],
      parameters: {},
    };
    // We map these back to a simple default export, even though we have type guarantees at this point
    this.csfExports[fileName] = { default: meta };

    api.add = (storyName: string, storyFn: StoryFn<TFramework>, parameters: Parameters = {}) => {
      hasAdded = true;

      if (typeof storyName !== 'string') {
        throw new Error(`Invalid or missing storyName provided for a "${kind}" story.`);
      }

      if (!storyFn || Array.isArray(storyFn) || invalidStoryTypes.has(typeof storyFn)) {
        throw new Error(
          `Cannot load story "${storyName}" in "${kind}" due to invalid format. Storybook expected a function/object but received ${typeof storyFn} instead.`
        );
      }

      const { decorators, loaders, ...storyParameters } = parameters;

      const csfExports = this.csfExports[fileName];
      // Whack a _ on the front incase it is "default"
      csfExports[`_${sanitize(storyName)}`] = {
        name: storyName,
        parameters: { fileName, ...storyParameters },
        decorators,
        loaders,
        render: storyFn,
      };

      const storyId = parameters?.__id || toId(kind, storyName);
      this.stories[storyId] = {
        title: csfExports.default.title,
        name: storyName,
        importPath: fileName,
      };

      return api;
    };

    api.addDecorator = (decorator: DecoratorFunction<TFramework>) => {
      if (hasAdded)
        throw new Error(`You cannot add a decorator after the first story for a kind.
Read more here: https://github.com/storybookjs/storybook/blob/master/MIGRATION.md#can-no-longer-add-decoratorsparameters-after-stories`);

      meta.decorators.push(decorator);
      return api;
    };

    api.addLoader = (loader: LoaderFunction<TFramework>) => {
      if (hasAdded) throw new Error(`You cannot add a loader after the first story for a kind.`);

      meta.loaders.push(loader);
      return api;
    };

    api.addParameters = (parameters: Parameters) => {
      if (hasAdded)
        throw new Error(`You cannot add parameters after the first story for a kind.
Read more here: https://github.com/storybookjs/storybook/blob/master/MIGRATION.md#can-no-longer-add-decoratorsparameters-after-stories`);

      meta.parameters = combineParameters(meta.parameters, parameters);
      return api;
    };

    return api;
  };

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
    const { title } = defaultExport || {};
    if (!title) {
      throw new Error(
        `Unexpected default export without title: ${JSON.stringify(fileExports.default)}`
      );
    }

    this.csfExports[fileName] = fileExports;

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
      const id = storyExport.parameters?.__id || toId(title, actualName);
      this.stories[id] = {
        name: actualName,
        title,
        importPath: fileName,
      };
    });
  }

  getStorybook(): GetStorybookKind<TFramework>[] {
    const storiesList = this.getStoriesList();

    const kinds: Record<ComponentTitle, GetStorybookKind<TFramework>> = {};
    Object.entries(storiesList.stories).forEach(([storyId, { title, name, importPath }]) => {
      if (!kinds[title]) {
        kinds[title] = { kind: title, fileName: importPath, stories: [] };
      }

      const csfFile = this.storyStore.cachedCSFFiles[importPath];
      const { unboundStoryFn } = this.storyStore.storyFromCSFFile({
        storyId,
        csfFile,
      });
      kinds[title].stories.push({ name, render: unboundStoryFn });
    });

    return Object.values(kinds);
  }
}
