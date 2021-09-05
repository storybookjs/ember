import memoize from 'memoizerific';
import {
  Parameters,
  StoryId,
  StoryContextForLoaders,
  AnyFramework,
  GlobalAnnotations,
  ComponentTitle,
} from '@storybook/csf';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';

import { StoriesListStore } from './StoriesListStore';
import { ArgsStore } from './ArgsStore';
import { GlobalsStore } from './GlobalsStore';
import { processCSFFile } from './processCSFFile';
import { prepareStory } from './prepareStory';
import {
  CSFFile,
  ModuleImportFn,
  Story,
  NormalizedGlobalAnnotations,
  Path,
  ExtractOptions,
  ModuleExports,
  BoundStory,
} from './types';
import { HooksContext } from './hooks';
import { normalizeInputTypes } from './normalizeInputTypes';
import { inferArgTypes } from './inferArgTypes';
import { inferControls } from './inferControls';

// TODO -- what are reasonable values for these?
const CSF_CACHE_SIZE = 100;
const STORY_CACHE_SIZE = 1000;

function normalizeGlobalAnnotations<TFramework extends AnyFramework>({
  argTypes,
  globalTypes,
  argTypesEnhancers,
  ...annotations
}: GlobalAnnotations<TFramework>): NormalizedGlobalAnnotations<TFramework> {
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
  storiesList: StoriesListStore;

  importFn: ModuleImportFn;

  globalAnnotations: NormalizedGlobalAnnotations<TFramework>;

  globals: GlobalsStore;

  args: ArgsStore;

  hooks: Record<StoryId, HooksContext<TFramework>>;

  cachedCSFFiles?: Record<Path, CSFFile<TFramework>>;

  processCSFFileWithCache: typeof processCSFFile;

  prepareStoryWithCache: typeof prepareStory;

  constructor({
    importFn,
    globalAnnotations,
    fetchStoriesList,
  }: {
    importFn: ModuleImportFn;
    globalAnnotations: GlobalAnnotations<TFramework>;
    fetchStoriesList: ConstructorParameters<typeof StoriesListStore>[0]['fetchStoriesList'];
  }) {
    this.storiesList = new StoriesListStore({ fetchStoriesList });
    this.importFn = importFn;
    this.globalAnnotations = normalizeGlobalAnnotations(globalAnnotations);

    const { globals, globalTypes } = globalAnnotations;
    this.globals = new GlobalsStore({ globals, globalTypes });
    this.args = new ArgsStore();
    this.hooks = {};

    this.processCSFFileWithCache = memoize(CSF_CACHE_SIZE)(processCSFFile) as typeof processCSFFile;
    this.prepareStoryWithCache = memoize(STORY_CACHE_SIZE)(prepareStory) as typeof prepareStory;
  }

  async initialize({ cacheAllCSFFiles = false }: { cacheAllCSFFiles?: boolean } = {}) {
    await this.storiesList.initialize();

    if (cacheAllCSFFiles) {
      await this.cacheAllCSFFiles();
    }
  }

  initializeSync({ cacheAllCSFFiles = false }: { cacheAllCSFFiles?: boolean } = {}) {
    this.storiesList.initializeSync();

    if (cacheAllCSFFiles) {
      this.cacheAllCSFFilesSync();
    }
  }

  updateGlobalAnnotations(globalAnnotations: GlobalAnnotations<TFramework>) {
    this.globalAnnotations = normalizeGlobalAnnotations(globalAnnotations);
    const { globals, globalTypes } = globalAnnotations;
    this.globals.resetOnGlobalAnnotationsChange({ globals, globalTypes });
  }

  async onImportFnChanged({ importFn }: { importFn: ModuleImportFn }) {
    this.importFn = importFn;

    // We need to refetch the stories list as it may have changed too
    await this.storiesList.cacheStoriesList();

    if (this.cachedCSFFiles) {
      await this.cacheAllCSFFiles();
    }
  }

  async loadCSFFileByStoryId(storyId: StoryId): Promise<CSFFile<TFramework>> {
    const { importPath, title } = this.storiesList.storyIdToMetadata(storyId);
    const moduleExports = await this.importFn(importPath);
    return this.processCSFFileWithCache(moduleExports, title);
  }

  loadCSFFileByStoryIdSync(storyId: StoryId): CSFFile<TFramework> {
    const { importPath, title } = this.storiesList.storyIdToMetadata(storyId);
    const moduleExports = this.importFn(importPath);
    if (Promise.resolve(moduleExports) === moduleExports) {
      throw new Error(
        `importFn() returned a promise, did you pass an async version then call initializeSync()?`
      );
    }
    return this.processCSFFileWithCache(moduleExports as ModuleExports, title);
  }

  async loadAllCSFFiles(): Promise<Record<Path, CSFFile<TFramework>>> {
    const importPaths: Record<Path, StoryId> = {};
    Object.entries(this.storiesList.storiesList.stories).forEach(([storyId, { importPath }]) => {
      importPaths[importPath] = storyId;
    });

    const csfFileList = await Promise.all(
      Object.entries(importPaths).map(
        async ([importPath, storyId]): Promise<[Path, CSFFile<TFramework>]> => [
          importPath,
          await this.loadCSFFileByStoryId(storyId),
        ]
      )
    );

    return csfFileList.reduce((acc, [importPath, csfFile]) => {
      acc[importPath] = csfFile;
      return acc;
    }, {} as Record<Path, CSFFile<TFramework>>);
  }

  loadAllCSFFilesSync(): Record<Path, CSFFile<TFramework>> {
    const importPaths: Record<Path, StoryId> = {};
    Object.entries(this.storiesList.storiesList.stories).forEach(([storyId, { importPath }]) => {
      importPaths[importPath] = storyId;
    });

    const csfFileList = Object.entries(importPaths).map(([importPath, storyId]): [
      Path,
      CSFFile<TFramework>
    ] => [importPath, this.loadCSFFileByStoryIdSync(storyId)]);

    return csfFileList.reduce((acc, [importPath, csfFile]) => {
      acc[importPath] = csfFile;
      return acc;
    }, {} as Record<Path, CSFFile<TFramework>>);
  }

  async cacheAllCSFFiles(): Promise<void> {
    this.cachedCSFFiles = await this.loadAllCSFFiles();
  }

  cacheAllCSFFilesSync() {
    this.cachedCSFFiles = this.loadAllCSFFilesSync();
  }

  async loadStory({ storyId }: { storyId: StoryId }): Promise<Story<TFramework>> {
    const csfFile = await this.loadCSFFileByStoryId(storyId);
    return this.storyFromCSFFile({ storyId, csfFile });
  }

  storyFromCSFFile({
    storyId,
    csfFile,
  }: {
    storyId: StoryId;
    csfFile: CSFFile<TFramework>;
  }): Story<TFramework> {
    const storyMeta = csfFile.stories[storyId];
    if (!storyMeta) {
      throw new Error(`Didn't find '${storyId}' in CSF file, this is unexpected`);
    }
    const componentMeta = csfFile.meta;

    const story = this.prepareStoryWithCache(storyMeta, componentMeta, this.globalAnnotations);
    this.args.setInitial(story.id, story.initialArgs);
    this.hooks[story.id] = new HooksContext();
    return story;
  }

  componentStoriesFromCSFFile({ csfFile }: { csfFile: CSFFile<TFramework> }): Story<TFramework>[] {
    return Object.keys(csfFile.stories).map((storyId: StoryId) =>
      this.storyFromCSFFile({ storyId, csfFile })
    );
  }

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

  extract(options: ExtractOptions = { includeDocsOnly: false }) {
    if (!this.cachedCSFFiles) {
      throw new Error('Cannot call extract() unless you call cacheAllCSFFiles() first.');
    }

    return Object.entries(this.storiesList.storiesList.stories)
      .map(([storyId, { importPath }]) => {
        const csfFile = this.cachedCSFFiles[importPath];
        const story = this.storyFromCSFFile({ storyId, csfFile });

        if (!options.includeDocsOnly && story.parameters.docsOnly) {
          return false;
        }

        return Object.entries(story).reduce((acc, [key, value]) => {
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
        }, {});
      })
      .filter(Boolean);
  }

  getSetStoriesPayload() {
    const stories = this.extract();

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

  raw() {
    return this.extract().map(({ id }: { id: StoryId }) => this.fromId(id));
  }

  fromId(storyId: StoryId): BoundStory<TFramework> {
    if (!this.cachedCSFFiles) {
      throw new Error('Cannot call fromId/raw() unless you call cacheAllCSFFiles() first.');
    }

    const { importPath } = this.storiesList.storyIdToMetadata(storyId);
    if (!importPath) {
      throw new Error(`Unknown storyId ${storyId}`);
    }
    const csfFile = this.cachedCSFFiles[importPath];
    const story = this.storyFromCSFFile({ storyId, csfFile });
    return {
      ...story,
      storyFn: (context) =>
        story.unboundStoryFn({
          ...this.getStoryContext(story),
          viewMode: 'story',
          ...context,
        }),
    };
  }
}
