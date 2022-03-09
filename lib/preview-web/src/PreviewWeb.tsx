import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import global from 'global';
import { SynchronousPromise } from 'synchronous-promise';
import Events, { IGNORED_EXCEPTION } from '@storybook/core-events';
import { logger } from '@storybook/client-logger';
import { addons, Channel } from '@storybook/addons';
import { AnyFramework, StoryId, ProjectAnnotations, Args, Globals } from '@storybook/csf';
import {
  ModuleImportFn,
  Selection,
  Story,
  StoryStore,
  StorySpecifier,
  StoryIndex,
} from '@storybook/store';

import { WebProjectAnnotations } from './types';

import { UrlStore } from './UrlStore';
import { WebView } from './WebView';
import { PREPARE_ABORTED, StoryRender } from './StoryRender';
import { DocsRender } from './DocsRender';

const { window: globalWindow, fetch } = global;

function focusInInput(event: Event) {
  const target = event.target as Element;
  return /input|textarea/i.test(target.tagName) || target.getAttribute('contenteditable') !== null;
}

type PromiseLike<T> = Promise<T> | SynchronousPromise<T>;
type MaybePromise<T> = Promise<T> | T;
type StoryCleanupFn = () => MaybePromise<void>;

const STORY_INDEX_PATH = './stories.json';

type HTMLStoryRender<TFramework extends AnyFramework> = StoryRender<HTMLElement, TFramework>;

export class PreviewWeb<TFramework extends AnyFramework> {
  channel: Channel;

  serverChannel?: Channel;

  urlStore: UrlStore;

  storyStore: StoryStore<TFramework>;

  view: WebView;

  getStoryIndex?: () => StoryIndex;

  importFn?: ModuleImportFn;

  renderToDOM: WebProjectAnnotations<TFramework>['renderToDOM'];

  previewEntryError?: Error;

  currentSelection: Selection;

  currentRender: HTMLStoryRender<TFramework> | DocsRender<TFramework>;

  storyRenders: HTMLStoryRender<TFramework>[] = [];

  previousCleanup: StoryCleanupFn;

  constructor() {
    this.channel = addons.getChannel();
    if (global.FEATURES?.storyStoreV7 && addons.hasServerChannel()) {
      this.serverChannel = addons.getServerChannel();
    }
    this.view = new WebView();

    this.urlStore = new UrlStore();
    this.storyStore = new StoryStore();
    // Add deprecated APIs for back-compat
    // @ts-ignore
    this.storyStore.getSelection = deprecate(
      () => this.urlStore.selection,
      dedent`
        \`__STORYBOOK_STORY_STORE__.getSelection()\` is deprecated and will be removed in 7.0.
  
        To get the current selection, use the \`useStoryContext()\` hook from \`@storybook/addons\`.
      `
    );
  }

  // INITIALIZATION

  // NOTE: the reason that the preview and store's initialization code is written in a promise
  // style and not `async-await`, and the use of `SynchronousPromise`s is in order to allow
  // storyshots to immediately call `raw()` on the store without waiting for a later tick.
  // (Even simple things like `Promise.resolve()` and `await` involve the callback happening
  // in the next promise "tick").
  // See the comment in `storyshots-core/src/api/index.ts` for more detail.
  initialize({
    getStoryIndex,
    importFn,
    getProjectAnnotations,
  }: {
    // In the case of the v6 store, we can only get the index from the facade *after*
    // getProjectAnnotations has been run, thus this slightly awkward approach
    getStoryIndex?: () => StoryIndex;
    importFn: ModuleImportFn;
    getProjectAnnotations: () => MaybePromise<WebProjectAnnotations<TFramework>>;
  }) {
    // We save these two on initialization in case `getProjectAnnotations` errors,
    // in which case we may need them later when we recover.
    this.getStoryIndex = getStoryIndex;
    this.importFn = importFn;

    this.setupListeners();

    return this.getProjectAnnotationsOrRenderError(getProjectAnnotations).then(
      (projectAnnotations) => this.initializeWithProjectAnnotations(projectAnnotations)
    );
  }

  setupListeners() {
    globalWindow.onkeydown = this.onKeydown.bind(this);

    this.serverChannel?.on(Events.STORY_INDEX_INVALIDATED, this.onStoryIndexChanged.bind(this));

    this.channel.on(Events.SET_CURRENT_STORY, this.onSetCurrentStory.bind(this));
    this.channel.on(Events.UPDATE_QUERY_PARAMS, this.onUpdateQueryParams.bind(this));
    this.channel.on(Events.UPDATE_GLOBALS, this.onUpdateGlobals.bind(this));
    this.channel.on(Events.UPDATE_STORY_ARGS, this.onUpdateArgs.bind(this));
    this.channel.on(Events.RESET_STORY_ARGS, this.onResetArgs.bind(this));
    this.channel.on(Events.FORCE_RE_RENDER, this.onForceReRender.bind(this));
    this.channel.on(Events.FORCE_REMOUNT, this.onForceRemount.bind(this));
  }

  getProjectAnnotationsOrRenderError(
    getProjectAnnotations: () => MaybePromise<WebProjectAnnotations<TFramework>>
  ): PromiseLike<ProjectAnnotations<TFramework>> {
    return SynchronousPromise.resolve()
      .then(getProjectAnnotations)
      .then((projectAnnotations) => {
        this.renderToDOM = projectAnnotations.renderToDOM;
        if (!this.renderToDOM) {
          throw new Error(dedent`
            Expected your framework's preset to export a \`renderToDOM\` field.

            Perhaps it needs to be upgraded for Storybook 6.4?

            More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#mainjs-framework-field          
          `);
        }
        return projectAnnotations;
      })
      .catch((err) => {
        // This is an error extracting the projectAnnotations (i.e. evaluating the previewEntries) and
        // needs to be show to the user as a simple error
        this.renderPreviewEntryError('Error reading preview.js:', err);
        throw err;
      });
  }

  // If initialization gets as far as project annotations, this function runs.
  initializeWithProjectAnnotations(projectAnnotations: WebProjectAnnotations<TFramework>) {
    this.storyStore.setProjectAnnotations(projectAnnotations);

    this.setInitialGlobals();

    let storyIndexPromise: PromiseLike<StoryIndex>;
    if (global.FEATURES?.storyStoreV7) {
      storyIndexPromise = this.getStoryIndexFromServer();
    } else {
      if (!this.getStoryIndex) {
        throw new Error('No `getStoryIndex` passed defined in v6 mode');
      }
      storyIndexPromise = SynchronousPromise.resolve().then(this.getStoryIndex);
    }

    return storyIndexPromise
      .then((storyIndex: StoryIndex) => this.initializeWithStoryIndex(storyIndex))
      .catch((err) => {
        this.renderPreviewEntryError('Error loading story index:', err);
        throw err;
      });
  }

  async setInitialGlobals() {
    const { globals } = this.urlStore.selectionSpecifier || {};
    if (globals) {
      this.storyStore.globals.updateFromPersisted(globals);
    }
    this.emitGlobals();
  }

  emitGlobals() {
    this.channel.emit(Events.SET_GLOBALS, {
      globals: this.storyStore.globals.get() || {},
      globalTypes: this.storyStore.projectAnnotations.globalTypes || {},
    });
  }

  async getStoryIndexFromServer() {
    const result = await fetch(STORY_INDEX_PATH);
    if (result.status === 200) return result.json() as StoryIndex;

    throw new Error(await result.text());
  }

  // If initialization gets as far as the story index, this function runs.
  initializeWithStoryIndex(storyIndex: StoryIndex) {
    return this.storyStore
      .initialize({
        storyIndex,
        importFn: this.importFn,
        cache: !global.FEATURES?.storyStoreV7,
      })
      .then(() => {
        if (!global.FEATURES?.storyStoreV7) {
          this.channel.emit(Events.SET_STORIES, this.storyStore.getSetStoriesPayload());
        }

        return this.selectSpecifiedStory();
      });
  }

  // Use the selection specifier to choose a story, then render it
  async selectSpecifiedStory() {
    if (!this.urlStore.selectionSpecifier) {
      this.renderMissingStory();
      return;
    }

    const { storySpecifier, viewMode, args } = this.urlStore.selectionSpecifier;
    const storyId = this.storyStore.storyIndex.storyIdFromSpecifier(storySpecifier);

    if (!storyId) {
      if (storySpecifier === '*') {
        this.renderStoryLoadingException(
          storySpecifier,
          new Error(dedent`
            Couldn't find any stories in your Storybook.
            - Please check your stories field of your main.js config.
            - Also check the browser console and terminal for error messages.
          `)
        );
      } else {
        this.renderStoryLoadingException(
          storySpecifier,
          new Error(dedent`
            Couldn't find story matching '${storySpecifier}'.
            - Are you sure a story with that id exists?
            - Please check your stories field of your main.js config.
            - Also check the browser console and terminal for error messages.
          `)
        );
      }

      return;
    }

    this.urlStore.setSelection({ storyId, viewMode });
    this.channel.emit(Events.STORY_SPECIFIED, this.urlStore.selection);

    this.channel.emit(Events.CURRENT_STORY_WAS_SET, this.urlStore.selection);

    await this.renderSelection({ persistedArgs: args });
  }

  // EVENT HANDLERS

  // This happens when a config file gets reloaded
  async onGetProjectAnnotationsChanged({
    getProjectAnnotations,
  }: {
    getProjectAnnotations: () => MaybePromise<ProjectAnnotations<TFramework>>;
  }) {
    delete this.previewEntryError;

    const projectAnnotations = await this.getProjectAnnotationsOrRenderError(getProjectAnnotations);
    if (!this.storyStore.projectAnnotations) {
      await this.initializeWithProjectAnnotations(projectAnnotations);
      return;
    }

    await this.storyStore.setProjectAnnotations(projectAnnotations);
    this.emitGlobals();
    this.renderSelection();
  }

  async onStoryIndexChanged() {
    delete this.previewEntryError;

    if (!this.storyStore.projectAnnotations) {
      // We haven't successfully set project annotations yet,
      // we need to do that before we can do anything else.
      return;
    }

    try {
      const storyIndex = await this.getStoryIndexFromServer();

      // This is the first time the story index worked, let's load it into the store
      if (!this.storyStore.storyIndex) {
        await this.initializeWithStoryIndex(storyIndex);
      }

      // Update the store with the new stories.
      await this.onStoriesChanged({ storyIndex });
    } catch (err) {
      this.renderPreviewEntryError('Error loading story index:', err);
      throw err;
    }
  }

  // This happens when a glob gets HMR-ed
  async onStoriesChanged({
    importFn,
    storyIndex,
  }: {
    importFn?: ModuleImportFn;
    storyIndex?: StoryIndex;
  }) {
    await this.storyStore.onStoriesChanged({ importFn, storyIndex });
    if (!global.FEATURES?.storyStoreV7) {
      this.channel.emit(Events.SET_STORIES, await this.storyStore.getSetStoriesPayload());
    }

    if (this.urlStore.selection) {
      await this.renderSelection();
    } else {
      // Our selection has never applied before, but maybe it does now, let's try!
      await this.selectSpecifiedStory();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.currentRender?.disableKeyListeners && !focusInInput(event)) {
      // We have to pick off the keys of the event that we need on the other side
      const { altKey, ctrlKey, metaKey, shiftKey, key, code, keyCode } = event;
      this.channel.emit(Events.PREVIEW_KEYDOWN, {
        event: { altKey, ctrlKey, metaKey, shiftKey, key, code, keyCode },
      });
    }
  }

  onSetCurrentStory(selection: Selection) {
    this.urlStore.setSelection(selection);
    this.channel.emit(Events.CURRENT_STORY_WAS_SET, this.urlStore.selection);
    this.renderSelection();
  }

  onUpdateQueryParams(queryParams: any) {
    this.urlStore.setQueryParams(queryParams);
  }

  async onUpdateGlobals({ globals }: { globals: Globals }) {
    this.storyStore.globals.update(globals);

    await Promise.all(this.storyRenders.map((r) => r.rerender()));

    if (this.currentRender instanceof DocsRender) await this.currentRender.rerender();

    this.channel.emit(Events.GLOBALS_UPDATED, {
      globals: this.storyStore.globals.get(),
      initialGlobals: this.storyStore.globals.initialGlobals,
    });
  }

  async onUpdateArgs({ storyId, updatedArgs }: { storyId: StoryId; updatedArgs: Args }) {
    this.storyStore.args.update(storyId, updatedArgs);

    await Promise.all(this.storyRenders.filter((r) => r.id === storyId).map((r) => r.rerender()));

    // NOTE: we aren't checking to see the story args are targetted at the "right" story.
    // This is because we may render >1 story on the page and there is no easy way to keep track
    // of which ones were rendered by the docs page.
    // However, in `modernInlineRender`, the individual stories track their own events as they
    // each call `renderStoryToElement` below.
    if (this.currentRender instanceof DocsRender) await this.currentRender.rerender();

    this.channel.emit(Events.STORY_ARGS_UPDATED, {
      storyId,
      args: this.storyStore.args.get(storyId),
    });
  }

  async onResetArgs({ storyId, argNames }: { storyId: string; argNames?: string[] }) {
    // NOTE: we have to be careful here and avoid await-ing when updating the current story's args.
    // That's because below in `renderStoryToElement` we have also bound to this event and will
    // render the story in the same tick.
    // However, we can do that safely as the current story is available in `this.currentRender.story`
    const { initialArgs } =
      storyId === this.currentRender?.id
        ? this.currentRender.story
        : await this.storyStore.loadStory({ storyId });

    const argNamesToReset = argNames || Object.keys(this.storyStore.args.get(storyId));
    const updatedArgs = argNamesToReset.reduce((acc, argName) => {
      acc[argName] = initialArgs[argName];
      return acc;
    }, {} as Partial<Args>);

    await this.onUpdateArgs({ storyId, updatedArgs });
  }

  // ForceReRender does not include a story id, so we simply must
  // re-render all stories in case they are relevant
  async onForceReRender() {
    await Promise.all(this.storyRenders.map((r) => r.rerender()));
  }

  async onForceRemount({ storyId }: { storyId: StoryId }) {
    await Promise.all(this.storyRenders.filter((r) => r.id === storyId).map((r) => r.remount()));
  }

  // RENDERING

  // We can either have:
  // - a story selected in "story" viewMode,
  //     in which case we render it to the root element, OR
  // - a story selected in "docs" viewMode,
  //     in which case we render the docsPage for that story
  async renderSelection({ persistedArgs }: { persistedArgs?: Args } = {}) {
    const { selection } = this.urlStore;
    if (!selection) {
      throw new Error('Cannot render story as no selection was made');
    }

    const { storyId } = selection;

    const storyIdChanged = this.currentSelection?.storyId !== storyId;
    const viewModeChanged = this.currentSelection?.viewMode !== selection.viewMode;

    // Show a spinner while we load the next story
    if (selection.viewMode === 'story') {
      this.view.showPreparingStory();
    } else {
      this.view.showPreparingDocs();
    }

    const lastSelection = this.currentSelection;
    let lastRender = this.currentRender;

    // If the last render is still preparing, let's drop it right now. Either
    //   (a) it is a different story, which means we would drop it later, OR
    //   (b) it is the *same* story, in which case we will resolve our own .prepare() at the
    //       same moment anyway, and we should just "take over" the rendering.
    // (We can't tell which it is yet, because it is possible that an HMR is going on and
    //  even though the storyId is the same, the story itself is not).
    if (lastRender?.isPreparing()) {
      await this.teardownRender(lastRender);
      lastRender = null;
    }

    const storyRender: PreviewWeb<TFramework>['currentRender'] = new StoryRender<
      HTMLElement,
      TFramework
    >(
      this.channel,
      this.storyStore,
      this.renderToDOM,
      this.mainStoryCallbacks(storyId),
      storyId,
      'story'
    );
    // We need to store this right away, so if the story changes during
    // the async `.prepare()` below, we can (potentially) cancel it
    this.currentSelection = selection;
    // Note this may be replaced by a docsRender after preparing
    this.currentRender = storyRender;

    try {
      await storyRender.prepare();
    } catch (err) {
      if (err !== PREPARE_ABORTED) {
        // We are about to render an error so make sure the previous story is
        // no longer rendered.
        await this.teardownRender(lastRender);
        this.renderStoryLoadingException(storyId, err);
      }
      return;
    }
    const implementationChanged = !storyIdChanged && !storyRender.isEqual(lastRender);

    if (persistedArgs) this.storyStore.args.updateFromPersisted(storyRender.story, persistedArgs);

    const { parameters, initialArgs, argTypes, args } = storyRender.context();

    // Don't re-render the story if nothing has changed to justify it
    if (lastRender && !storyIdChanged && !implementationChanged && !viewModeChanged) {
      this.currentRender = lastRender;
      this.channel.emit(Events.STORY_UNCHANGED, storyId);
      this.view.showMain();
      return;
    }

    // Wait for the previous render to leave the page. NOTE: this will wait to ensure anything async
    // is properly aborted, which (in some cases) can lead to the whole screen being refreshed.
    await this.teardownRender(lastRender, { viewModeChanged });

    // If we are rendering something new (as opposed to re-rendering the same or first story), emit
    if (lastSelection && (storyIdChanged || viewModeChanged)) {
      this.channel.emit(Events.STORY_CHANGED, storyId);
    }

    if (global.FEATURES?.storyStoreV7) {
      this.channel.emit(Events.STORY_PREPARED, {
        id: storyId,
        parameters,
        initialArgs,
        argTypes,
        args,
      });
    }

    // For v6 mode / compatibility
    // If the implementation changed, or args were persisted, the args may have changed,
    // and the STORY_PREPARED event above may not be respected.
    if (implementationChanged || persistedArgs) {
      this.channel.emit(Events.STORY_ARGS_UPDATED, { storyId, args });
    }

    if (selection.viewMode === 'docs' || parameters.docsOnly) {
      this.currentRender = storyRender.toDocsRender();
      this.currentRender.renderToElement(this.view.prepareForDocs(), this.renderStoryToElement);
    } else {
      this.storyRenders.push(storyRender);
      this.currentRender.renderToElement(this.view.prepareForStory(storyRender.story));
    }
  }

  // Used by docs' modernInlineRender to render a story to a given element
  // Note this short-circuits the `prepare()` phase of the StoryRender,
  // main to be consistent with the previous behaviour. In the future,
  // we will change it to go ahead and load the story, which will end up being
  // "instant", although async.
  renderStoryToElement(story: Story<TFramework>, element: HTMLElement) {
    const render = new StoryRender<HTMLElement, TFramework>(
      this.channel,
      this.storyStore,
      this.renderToDOM,
      this.inlineStoryCallbacks(story.id),
      story.id,
      'docs',
      story
    );
    render.renderToElement(element);

    this.storyRenders.push(render);

    return async () => {
      await this.teardownRender(render);
    };
  }

  async teardownRender(
    render: HTMLStoryRender<TFramework> | DocsRender<TFramework>,
    { viewModeChanged }: { viewModeChanged?: boolean } = {}
  ) {
    this.storyRenders = this.storyRenders.filter((r) => r !== render);
    await render?.teardown({ viewModeChanged });
  }

  // API
  async extract(options?: { includeDocsOnly: boolean }) {
    if (this.previewEntryError) {
      throw this.previewEntryError;
    }

    if (!this.storyStore.projectAnnotations) {
      // In v6 mode, if your preview.js throws, we never get a chance to initialize the preview
      // or store, and the error is simply logged to the browser console. This is the best we can do
      throw new Error(dedent`Failed to initialize Storybook.
      
      Do you have an error in your \`preview.js\`? Check your Storybook's browser console for errors.`);
    }

    if (global.FEATURES?.storyStoreV7) {
      await this.storyStore.cacheAllCSFFiles();
    }

    return this.storyStore.extract(options);
  }

  // UTILITIES
  mainStoryCallbacks(storyId: StoryId) {
    return {
      showMain: () => this.view.showMain(),
      showError: (err: { title: string; description: string }) => this.renderError(storyId, err),
      showException: (err: Error) => this.renderException(storyId, err),
    };
  }

  inlineStoryCallbacks(storyId: StoryId) {
    return {
      showMain: () => {},
      showError: (err: { title: string; description: string }) =>
        logger.error(`Error rendering docs story (${storyId})`, err),
      showException: (err: Error) => logger.error(`Error rendering docs story (${storyId})`, err),
    };
  }

  renderPreviewEntryError(reason: string, err: Error) {
    this.previewEntryError = err;
    logger.error(reason);
    logger.error(err);
    this.view.showErrorDisplay(err);
    this.channel.emit(Events.CONFIG_ERROR, err);
  }

  renderMissingStory() {
    this.view.showNoPreview();
    this.channel.emit(Events.STORY_MISSING);
  }

  renderStoryLoadingException(storySpecifier: StorySpecifier, err: Error) {
    logger.error(`Unable to load story '${storySpecifier}':`);
    logger.error(err);
    this.view.showErrorDisplay(err);
    this.channel.emit(Events.STORY_MISSING, storySpecifier);
  }

  // renderException is used if we fail to render the story and it is uncaught by the app layer
  renderException(storyId: StoryId, err: Error) {
    this.channel.emit(Events.STORY_THREW_EXCEPTION, err);
    this.channel.emit(Events.STORY_RENDER_PHASE_CHANGED, { newPhase: 'errored', storyId });

    // Ignored exceptions exist for control flow purposes, and are typically handled elsewhere.
    if (err !== IGNORED_EXCEPTION) {
      this.view.showErrorDisplay(err);
      logger.error(`Error rendering story '${storyId}':`);
      logger.error(err);
    }
  }

  // renderError is used by the various app layers to inform the user they have done something
  // wrong -- for instance returned the wrong thing from a story
  renderError(storyId: StoryId, { title, description }: { title: string; description: string }) {
    logger.error(`Error rendering story ${title}: ${description}`);
    this.channel.emit(Events.STORY_ERRORED, { title, description });
    this.channel.emit(Events.STORY_RENDER_PHASE_CHANGED, { newPhase: 'errored', storyId });
    this.view.showErrorDisplay({
      message: title,
      stack: description,
    });
  }
}
