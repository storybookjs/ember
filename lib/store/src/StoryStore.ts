import memoize from 'memoizerific';
import {
  Parameters,
  StoryId,
  StoryContextForLoaders,
  AnyFramework,
  ProjectAnnotations,
  ComponentTitle,
  StoryContext,
} from '@storybook/csf';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';

import { StoryIndexStore } from './StoryIndexStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import {
  CSFFile,
  ModuleImportFn,
  Story,
  NormalizedProjectAnnotations,
  Path,
  ExtractOptions,
  ModuleExports,
  BoundStory,
} from './types';
import { HooksContext } from './hooks';
import { normalizeInputTypes } from './normalizeInputTypes';
import { inferArgTypes } from './inferArgTypes';
import { inferControls } from './inferControls';
import { StoryIndex } from '.';

type MaybePromise<T> = Promise<T> | T;

// TODO -- what are reasonable values for these?
const CSF_CACHE_SIZE = 1000;
const STORY_CACHE_SIZE = 10000;

function normalizeProjectAnnotations<TFramework extends AnyFramework>({
  argTypes,
  globalTypes,
  argTypesEnhancers,
  ...annotations
}: ProjectAnnotations<TFramework>): NormalizedProjectAnnotations<TFramework> {
  return {
    ...(argTypes && { argTypes: normalizeInputTypes(argTypes) }),
    ...(globalTypes && { globalTypes: normalizeInputTypes(globalTypes) }),
    argTypesEnhancers: [
      ...(argTypesEnhancers || []),
      inferArgTypes,
      // inferControls technically should only run if the user is using the controls addon,
      // and so should be added by a preset there. However, as it seems some code relies on controls
      // annotations (in particular the angular implementation's `cleanArgsDecorator`), for backwards
      // compatibility reasons, we will leave this in the store until 7.0
      inferControls,
    ],
    ...annotations,
  };
}

export class StoryStore<TFramework extends AnyFramework> {
  storyIndex: StoryIndexStore;

  importFn: ModuleImportFn;

  projectAnnotations: NormalizedProjectAnnotations<TFramework>;

  globals: GlobalsStore;

  args: ArgsStore;

  hooks: Record<StoryId, HooksContext<TFramework>>;

  cachedCSFFiles?: Record<Path, CSFFile<TFramework>>;

  processCSFFileWithCache: typeof processCSFFile;

  prepareStoryWithCache: typeof prepareStory;

  constructor() {
    this.globals = new GlobalsStore();
    this.args = new ArgsStore();
    this.hooks = {};

    // We use a cache for these two functions for two reasons:
    //  1. For performance
    //  2. To ensure that when the same story is prepared with the same inputs you get the same output
    this.processCSFFileWithCache = memoize(CSF_CACHE_SIZE)(processCSFFile) as typeof processCSFFile;
    this.prepareStoryWithCache = memoize(STORY_CACHE_SIZE)(prepareStory) as typeof prepareStory;
  }

  initialize({
    getStoryIndex,
    importFn,
    projectAnnotations,
    cache = false,
  }: {
    getStoryIndex: () => StoryIndex;
    importFn: ModuleImportFn;
    projectAnnotations: ProjectAnnotations<TFramework>;
    cache?: boolean;
  }): void {
    this.projectAnnotations = normalizeProjectAnnotations(projectAnnotations);

    // Frustratingly we need to pass getStoryIndex (rather than just storyIndex), as
    // we cannot call getStoryIndex on the v6 StoryStoreFacade until the project annotations are set above.
    this.storyIndex = new StoryIndexStore(getStoryIndex());
    this.importFn = importFn;

    const { globals, globalTypes } = this.projectAnnotations;
    this.globals.initialize({ globals, globalTypes });

    if (cache) this.cacheAllCSFFiles(true);
  }

  // This means the preview.[tj]s file has changed.
  // By changing `this.projectAnnotations, we implicitly invalidate the `prepareStoryWithCache`
  updateProjectAnnotations(projectAnnotations: ProjectAnnotations<TFramework>) {
    this.projectAnnotations = normalizeProjectAnnotations(projectAnnotations);
    const { globals, globalTypes } = projectAnnotations;
    this.globals.resetOnProjectAnnotationsChange({ globals, globalTypes });
  }

  // This means that one of the CSF files has changed.
  // If the `importFn` has changed, we will invalidate both caches.
  // If the `storyIndex` data has changed, we may or may not invalidate the caches, depending
  // on whether we've loaded the relevant files yet.
  async onStoriesChanged({
    importFn,
    storyIndex,
  }: {
    importFn?: ModuleImportFn;
    storyIndex?: StoryIndex;
  }) {
    if (importFn) this.importFn = importFn;
    if (storyIndex) this.storyIndex.stories = storyIndex.stories;

    if (this.cachedCSFFiles) {
      await this.cacheAllCSFFiles(false);
    }
  }

  // To load a single CSF file to service a story we need to look up the importPath in the index
  loadCSFFileByStoryId(storyId: StoryId, options: { sync: false }): Promise<CSFFile<TFramework>>;

  loadCSFFileByStoryId(storyId: StoryId, options: { sync: true }): CSFFile<TFramework>;

  loadCSFFileByStoryId(
    storyId: StoryId,
    { sync = false }: { sync?: boolean } = {}
  ): MaybePromise<CSFFile<TFramework>> {
    const { importPath, title } = this.storyIndex.storyIdToEntry(storyId);
    const moduleExportsOrPromise = this.importFn(importPath);

    const isPromise = Promise.resolve(moduleExportsOrPromise) === moduleExportsOrPromise;
    if (!isPromise) {
      // We pass the title in here as it may have been generated by autoTitle on the server.
      return this.processCSFFileWithCache(moduleExportsOrPromise as ModuleExports, title);
    }

    if (sync) {
      throw new Error(
        `importFn() returned a promise, did you pass an async version then call initialize({sync: true})?`
      );
    }

    return (moduleExportsOrPromise as Promise<ModuleExports>).then((moduleExports) =>
      // We pass the title in here as it may have been generated by autoTitle on the server.
      this.processCSFFileWithCache(moduleExports, title)
    );
  }

  loadAllCSFFiles(sync: false): Promise<StoryStore<TFramework>['cachedCSFFiles']>;

  loadAllCSFFiles(sync: true): StoryStore<TFramework>['cachedCSFFiles'];

  loadAllCSFFiles(sync: boolean): MaybePromise<StoryStore<TFramework>['cachedCSFFiles']> {
    const importPaths: Record<Path, StoryId> = {};
    Object.entries(this.storyIndex.stories).forEach(([storyId, { importPath }]) => {
      importPaths[importPath] = storyId;
    });

    const csfFileList = Object.entries(importPaths).map(([importPath, storyId]) => ({
      importPath,
      csfFileOrPromise: sync
        ? this.loadCSFFileByStoryId(storyId, { sync: true })
        : this.loadCSFFileByStoryId(storyId, { sync: false }),
    }));

    function toObject(list: { importPath: Path; csfFile: CSFFile<TFramework> }[]) {
      return list.reduce((acc, { importPath, csfFile }) => {
        acc[importPath] = csfFile;
        return acc;
      }, {} as Record<Path, CSFFile<TFramework>>);
    }

    if (sync) {
      return toObject(
        csfFileList.map(({ importPath, csfFileOrPromise }) => ({
          importPath,
          csfFile: csfFileOrPromise,
        })) as { importPath: Path; csfFile: CSFFile<TFramework> }[]
      );
    }
    return Promise.all(
      csfFileList.map(async ({ importPath, csfFileOrPromise }) => ({
        importPath,
        csfFile: await csfFileOrPromise,
      }))
    ).then(toObject);
  }

  cacheAllCSFFiles(sync: false): Promise<void>;

  cacheAllCSFFiles(sync: true): void;

  cacheAllCSFFiles(sync: boolean): MaybePromise<void> {
    if (sync) {
      this.cachedCSFFiles = this.loadAllCSFFiles(true);
      return null;
    }
    return this.loadAllCSFFiles(false).then((csfFiles) => {
      this.cachedCSFFiles = csfFiles;
    });
  }

  // Load the CSF file for a story and prepare the story from it and the project annotations.
  async loadStory({ storyId }: { storyId: StoryId }): Promise<Story<TFramework>> {
    const csfFile = await this.loadCSFFileByStoryId(storyId, { sync: false });
    return this.storyFromCSFFile({ storyId, csfFile });
  }

  // This function is synchronous for convenience -- often times if you have a CSF file already
  // it is easier not to have to await `loadStory`.
  storyFromCSFFile({
    storyId,
    csfFile,
  }: {
    storyId: StoryId;
    csfFile: CSFFile<TFramework>;
  }): Story<TFramework> {
    const storyAnnotations = csfFile.stories[storyId];
    if (!storyAnnotations) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentAnnotations = csfFile.meta;

    const story = this.prepareStoryWithCache(
      storyAnnotations,
      componentAnnotations,
      this.projectAnnotations
    );
    this.args.setInitial(story.id, story.initialArgs);
    this.hooks[story.id] = this.hooks[story.id] || new HooksContext();
    return story;
  }

  // If we have a CSF file we can get all the stories from it synchronously
  componentStoriesFromCSFFile({ csfFile }: { csfFile: CSFFile<TFramework> }): Story<TFramework>[] {
    return Object.keys(csfFile.stories).map((storyId: StoryId) =>
      this.storyFromCSFFile({ storyId, csfFile })
    );
  }

  // A prepared story does not include args, globals or hooks. These are stored in the story store
  // and updated separtely to the (immutable) story.
  getStoryContext(story: Story<TFramework>): Omit<StoryContextForLoaders<TFramework>, 'viewMode'> {
    return {
      ...story,
      args: this.args.get(story.id),
      globals: this.globals.get(),
      hooks: this.hooks[story.id] as unknown,
    };
  }

  cleanupStory(story: Story<TFramework>): void {
    this.hooks[story.id].clean();
  }

  extract(options: ExtractOptions = { includeDocsOnly: false }): Record<string, any> {
    if (!this.cachedCSFFiles) {
      throw new Error('Cannot call extract() unless you call cacheAllCSFFiles() first.');
    }

    return Object.entries(this.storyIndex.stories)
      .map(([storyId, { importPath }]) => {
        const csfFile = this.cachedCSFFiles[importPath];
        const story = this.storyFromCSFFile({ storyId, csfFile });

        if (!options.includeDocsOnly && story.parameters.docsOnly) {
          return false;
        }

        return Object.entries(story).reduce(
          (acc, [key, value]) => {
            if (typeof value === 'function') {
              return acc;
            }
            if (['hooks'].includes(key)) {
              return acc;
            }
            if (Array.isArray(value)) {
              return Object.assign(acc, { [key]: value.slice().sort() });
            }
            return Object.assign(acc, { [key]: value });
          },
          { args: story.initialArgs }
        );
      })
      .filter(Boolean);
  }

  getSetStoriesPayload() {
    const stories = this.extract({ includeDocsOnly: true });

    const kindParameters: Parameters = stories.reduce(
      (acc: Parameters, { title }: { title: ComponentTitle }) => {
        acc[title] = {};
        return acc;
      },
      {} as Parameters
    );

    return {
      v: 2,
      globals: this.globals.get(),
      globalParameters: {},
      kindParameters,
      stories,
    };
  }

  getStoriesJsonData = () => {
    const value = this.getSetStoriesPayload();
    const allowedParameters = ['fileName', 'docsOnly', 'framework', '__id', '__isArgsStory'];

    return {
      v: 2,
      globalParameters: pick(value.globalParameters, allowedParameters),
      kindParameters: mapValues(value.kindParameters, (v) => pick(v, allowedParameters)),
      stories: mapValues(value.stories, (v: any) => ({
        ...pick(v, ['id', 'name', 'kind', 'story']),
        parameters: pick(v.parameters, allowedParameters),
      })),
    };
  };

  raw(): BoundStory<TFramework>[] {
    return this.extract().map(({ id }: { id: StoryId }) => this.fromId(id));
  }

  fromId(storyId: StoryId): BoundStory<TFramework> {
    if (!this.cachedCSFFiles) {
      throw new Error('Cannot call fromId/raw() unless you call cacheAllCSFFiles() first.');
    }

    let importPath;
    try {
      ({ importPath } = this.storyIndex.storyIdToEntry(storyId));
    } catch (err) {
      return null;
    }
    const csfFile = this.cachedCSFFiles[importPath];
    const story = this.storyFromCSFFile({ storyId, csfFile });
    return {
      ...story,
      storyFn: (update) => {
        const context = {
          ...this.getStoryContext(story),
          viewMode: 'story',
        } as StoryContext<TFramework>;

        return story.unboundStoryFn({ ...context, ...update });
      },
    };
  }
}
