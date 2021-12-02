import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import global from 'global';
import { SynchronousPromise } from 'synchronous-promise';
import Events, { IGNORED_EXCEPTION } from '@storybook/core-events';
import { logger } from '@storybook/client-logger';
import { addons, Channel } from '@storybook/addons';
import {
  AnyFramework,
  StoryId,
  ProjectAnnotations,
  Args,
  Globals,
  ViewMode,
  StoryContextForLoaders,
  StoryContext,
} from '@storybook/csf';
import {
  ModuleImportFn,
  Selection,
  Story,
  RenderContext,
  CSFFile,
  StoryStore,
  StorySpecifier,
  StoryIndex,
} from '@storybook/store';

import { WebProjectAnnotations } from './types';

import { UrlStore } from './UrlStore';
import { WebView } from './WebView';

const { window: globalWindow, AbortController, fetch } = global;

function focusInInput(event: Event) {
  const target = event.target as Element;
  return /input|textarea/i.test(target.tagName) || target.getAttribute('contenteditable') !== null;
}

function createController(): AbortController {
  if (AbortController) return new AbortController();
  // Polyfill for IE11
  return {
    signal: { aborted: false },
    abort() {
      this.signal.aborted = true;
    },
  } as AbortController;
}

export type RenderPhase =
  | 'loading'
  | 'rendering'
  | 'playing'
  | 'played'
  | 'completed'
  | 'aborted'
  | 'errored';
type PromiseLike<T> = Promise<T> | SynchronousPromise<T>;
type MaybePromise<T> = Promise<T> | T;
type StoryCleanupFn = () => MaybePromise<void>;

const STORY_INDEX_PATH = './stories.json';

export class PreviewWeb<TFramework extends AnyFramework> {
  channel: Channel;

  serverChannel?: Channel;

  urlStore: UrlStore;

  storyStore: StoryStore<TFramework>;

  view: WebView;

  getStoryIndex?: () => StoryIndex;

  importFn?: ModuleImportFn;

  renderToDOM: WebProjectAnnotations<TFramework>['renderToDOM'];

  previousSelection: Selection;

  previousStory: Story<TFramework>;

  previousCleanup: StoryCleanupFn;

  abortController: AbortController;

  disableKeyListeners: boolean;

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

    return this.getProjectAnnotationsOrRenderError(
      getProjectAnnotations
    ).then((projectAnnotations) => this.initializeWithProjectAnnotations(projectAnnotations));
  }

  setupListeners() {
    globalWindow.onkeydown = this.onKeydown.bind(this);

    this.serverChannel?.on(Events.STORY_INDEX_INVALIDATED, this.onStoryIndexChanged.bind(this));

    this.channel.on(Events.SET_CURRENT_STORY, this.onSetCurrentStory.bind(this));
    this.channel.on(Events.UPDATE_QUERY_PARAMS, this.onUpdateQueryParams.bind(this));
    this.channel.on(Events.UPDATE_GLOBALS, this.onUpdateGlobals.bind(this));
    this.channel.on(Events.UPDATE_STORY_ARGS, this.onUpdateArgs.bind(this));
    this.channel.on(Events.RESET_STORY_ARGS, this.onResetArgs.bind(this));
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
    if (!this.disableKeyListeners && !focusInInput(event)) {
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

  onUpdateGlobals({ globals }: { globals: Globals }) {
    this.storyStore.globals.update(globals);

    this.channel.emit(Events.GLOBALS_UPDATED, {
      globals: this.storyStore.globals.get(),
      initialGlobals: this.storyStore.globals.initialGlobals,
    });
  }

  onUpdateArgs({ storyId, updatedArgs }: { storyId: StoryId; updatedArgs: Args }) {
    this.storyStore.args.update(storyId, updatedArgs);
    this.channel.emit(Events.STORY_ARGS_UPDATED, {
      storyId,
      args: this.storyStore.args.get(storyId),
    });
  }

  async onResetArgs({ storyId, argNames }: { storyId: string; argNames?: string[] }) {
    // NOTE: we have to be careful here and avoid await-ing when updating the current story's args.
    // That's because below in `renderStoryToElement` we have also bound to this event and will
    // render the story in the same tick.
    // However, we can do that safely as the current story is available in `this.previousStory`
    const { initialArgs } =
      storyId === this.previousStory.id
        ? this.previousStory
        : await this.storyStore.loadStory({ storyId });

    const argNamesToReset = argNames || Object.keys(this.storyStore.args.get(storyId));
    const updatedArgs = argNamesToReset.reduce((acc, argName) => {
      acc[argName] = initialArgs[argName];
      return acc;
    }, {} as Partial<Args>);

    this.onUpdateArgs({ storyId, updatedArgs });
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

    const storyIdChanged = this.previousSelection?.storyId !== storyId;
    const viewModeChanged = this.previousSelection?.viewMode !== selection.viewMode;

    // Show a spinner while we load the next story
    if (selection.viewMode === 'story') {
      this.view.showPreparingStory();
    } else {
      this.view.showPreparingDocs();
    }

    let story;
    try {
      story = await this.storyStore.loadStory({ storyId });
    } catch (err) {
      await this.cleanupPreviousRender();
      this.previousStory = null;
      this.renderStoryLoadingException(storyId, err);
      return;
    }

    const implementationChanged =
      !storyIdChanged && this.previousStory && story !== this.previousStory;

    if (persistedArgs) {
      this.storyStore.args.updateFromPersisted(story, persistedArgs);
    }

    // Don't re-render the story if nothing has changed to justify it
    if (this.previousStory && !storyIdChanged && !implementationChanged && !viewModeChanged) {
      this.channel.emit(Events.STORY_UNCHANGED, storyId);
      this.view.showMain();
      return;
    }

    await this.cleanupPreviousRender({ unmountDocs: viewModeChanged });

    // If we are rendering something new (as opposed to re-rendering the same or first story), emit
    if (this.previousSelection && (storyIdChanged || viewModeChanged)) {
      this.channel.emit(Events.STORY_CHANGED, storyId);
    }

    // Record the previous selection *before* awaiting the rendering, in cases things change before it is done.
    this.previousSelection = selection;
    this.previousStory = story;

    const { parameters, initialArgs, argTypes, args } = this.storyStore.getStoryContext(story);
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

    if (selection.viewMode === 'docs' || story.parameters.docsOnly) {
      this.previousCleanup = await this.renderDocs({ story });
    } else {
      this.previousCleanup = this.renderStory({ story });
    }
  }

  async renderDocs({ story }: { story: Story<TFramework> }) {
    const { id, title, name } = story;
    const csfFile: CSFFile<TFramework> = await this.storyStore.loadCSFFileByStoryId(id);
    const docsContext = {
      id,
      title,
      name,
      // NOTE: these two functions are *sync* so cannot access stories from other CSF files
      storyById: (storyId: StoryId) => this.storyStore.storyFromCSFFile({ storyId, csfFile }),
      componentStories: () => this.storyStore.componentStoriesFromCSFFile({ csfFile }),
      loadStory: (storyId: StoryId) => this.storyStore.loadStory({ storyId }),
      renderStoryToElement: this.renderStoryToElement.bind(this),
      getStoryContext: (renderedStory: Story<TFramework>) =>
        ({
          ...this.storyStore.getStoryContext(renderedStory),
          viewMode: 'docs' as ViewMode,
        } as StoryContextForLoaders<TFramework>),
    };

    const render = async () => {
      const fullDocsContext = {
        ...docsContext,
        // Put all the storyContext fields onto the docs context for back-compat
        ...(!global.FEATURES?.breakingChangesV7 && this.storyStore.getStoryContext(story)),
      };

      const renderer = await import('./renderDocs');
      const element = this.view.prepareForDocs();
      renderer.renderDocs(story, fullDocsContext, element, () =>
        this.channel.emit(Events.DOCS_RENDERED, id)
      );
    };

    // Initially render right away
    render();

    // Listen to events and re-render
    // NOTE: we aren't checking to see the story args are targetted at the "right" story.
    // This is because we may render >1 story on the page and there is no easy way to keep track
    // of which ones were rendered by the docs page.
    // However, in `modernInlineRender`, the individual stories track their own events as they
    // each call `renderStoryToElement` below.
    if (!global.FEATURES?.modernInlineRender) {
      this.channel.on(Events.UPDATE_GLOBALS, render);
      this.channel.on(Events.UPDATE_STORY_ARGS, render);
      this.channel.on(Events.RESET_STORY_ARGS, render);
    }

    return async () => {
      if (!global.FEATURES?.modernInlineRender) {
        this.channel.off(Events.UPDATE_GLOBALS, render);
        this.channel.off(Events.UPDATE_STORY_ARGS, render);
        this.channel.off(Events.RESET_STORY_ARGS, render);
      }
    };
  }

  renderStory({ story }: { story: Story<TFramework> }) {
    const element = this.view.prepareForStory(story);
    const { id, componentId, title, name } = story;
    const renderContext = {
      componentId,
      title,
      kind: title,
      id,
      name,
      story: name,
      showMain: () => this.view.showMain(),
      showError: (err: { title: string; description: string }) => this.renderError(id, err),
      showException: (err: Error) => this.renderException(id, err),
    };

    return this.renderStoryToElement({ story, renderContext, element });
  }

  // Render a story into a given element and watch for the events that would trigger us
  // to re-render it (plus deal sensibly with things like changing story mid-way through).
  renderStoryToElement({
    story,
    renderContext: renderContextWithoutStoryContext,
    element: canvasElement,
  }: {
    story: Story<TFramework>;
    renderContext: Omit<
      RenderContext<TFramework>,
      'storyContext' | 'storyFn' | 'unboundStoryFn' | 'forceRemount'
    >;
    element: HTMLElement;
  }): StoryCleanupFn {
    const { id, applyLoaders, unboundStoryFn, playFunction } = story;

    let notYetRendered = true;
    let phase: RenderPhase;
    const isPending = () => ['rendering', 'playing'].includes(phase);

    this.abortController = createController();

    const render = async ({ initial = false, forceRemount = false } = {}) => {
      if (forceRemount && !initial) {
        this.abortController.abort();
        this.abortController = createController();
      }

      const abortSignal = this.abortController.signal; // we need a stable reference to the signal
      const runPhase = async (phaseName: RenderPhase, phaseFn?: () => MaybePromise<void>) => {
        phase = phaseName;
        this.channel.emit(Events.STORY_RENDER_PHASE_CHANGED, { newPhase: phase, storyId: id });
        if (phaseFn) await phaseFn();
        if (abortSignal.aborted) {
          phase = 'aborted';
          this.channel.emit(Events.STORY_RENDER_PHASE_CHANGED, { newPhase: phase, storyId: id });
        }
      };

      try {
        let loadedContext: StoryContext<TFramework>;
        await runPhase('loading', async () => {
          loadedContext = await applyLoaders({
            ...this.storyStore.getStoryContext(story),
            viewMode: canvasElement === this.view.storyRoot() ? 'story' : 'docs',
          } as StoryContextForLoaders<TFramework>);
        });
        if (abortSignal.aborted) return;

        const renderStoryContext: StoryContext<TFramework> = {
          ...loadedContext,
          // By this stage, it is possible that new args/globals have been received for this story
          // and we need to ensure we render it with the new values
          ...this.storyStore.getStoryContext(story),
          abortSignal,
          canvasElement,
        };
        const renderContext: RenderContext<TFramework> = {
          ...renderContextWithoutStoryContext,
          forceRemount: forceRemount || notYetRendered,
          storyContext: renderStoryContext,
          storyFn: () => unboundStoryFn(renderStoryContext),
          unboundStoryFn,
        };

        await runPhase('rendering', () => this.renderToDOM(renderContext, canvasElement));
        notYetRendered = false;
        if (abortSignal.aborted) return;

        if (forceRemount && playFunction) {
          this.disableKeyListeners = true;
          await runPhase('playing', () => playFunction(renderContext.storyContext));
          await runPhase('played');
          this.disableKeyListeners = false;
          if (abortSignal.aborted) return;
        }

        await runPhase('completed', () => this.channel.emit(Events.STORY_RENDERED, id));
      } catch (err) {
        renderContextWithoutStoryContext.showException(err);
      }
    };

    // Start the first (initial) render. We don't await here because we need to return the "cleanup"
    // function below right away, so if the user changes story during the first render we can cancel
    // it without having to first wait for it to finish.
    // Whenever the selection changes we want to force the component to be remounted.
    render({ initial: true, forceRemount: true });

    const remountStoryIfMatches = ({ storyId }: { storyId: StoryId }) => {
      if (storyId === story.id) render({ forceRemount: true });
    };
    const rerenderStoryIfMatches = ({ storyId }: { storyId: StoryId }) => {
      if (storyId === story.id) render();
    };

    // Listen to events and re-render story
    // Don't forget to unsubscribe on cleanup
    this.channel.on(Events.UPDATE_GLOBALS, render);
    this.channel.on(Events.FORCE_RE_RENDER, render);
    this.channel.on(Events.FORCE_REMOUNT, remountStoryIfMatches);
    this.channel.on(Events.UPDATE_STORY_ARGS, rerenderStoryIfMatches);
    this.channel.on(Events.RESET_STORY_ARGS, rerenderStoryIfMatches);

    // Cleanup / teardown function invoked on next render (via `cleanupPreviousRender`)
    return async () => {
      // If the story is torn down (either a new story is rendered or the docs page removes it)
      // we need to consider the fact that the initial render may not be finished
      // (possibly the loaders or the play function are still running). We use the controller
      // as a method to abort them, ASAP, but this is not foolproof as we cannot control what
      // happens inside the user's code.
      this.abortController.abort();

      this.storyStore.cleanupStory(story);
      this.channel.off(Events.UPDATE_GLOBALS, render);
      this.channel.off(Events.FORCE_RE_RENDER, render);
      this.channel.off(Events.FORCE_REMOUNT, remountStoryIfMatches);
      this.channel.off(Events.UPDATE_STORY_ARGS, rerenderStoryIfMatches);
      this.channel.off(Events.RESET_STORY_ARGS, rerenderStoryIfMatches);

      // Check if we're done rendering/playing. If not, we may have to reload the page.
      if (!isPending()) return;

      // Wait several ticks that may be needed to handle the abort, then try again.
      // Note that there's a max of 5 nested timeouts before they're no longer "instant".
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!isPending()) return;

      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!isPending()) return;

      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!isPending()) return;

      // If we still haven't completed, reload the page (iframe) to ensure we have a clean slate
      // for the next render. Since the reload can take a brief moment to happen, we want to stop
      // further rendering by awaiting a never-resolving promise (which is destroyed on reload).
      global.window.location.reload();
      await new Promise(() => {});
    };
  }

  async cleanupPreviousRender({ unmountDocs = true }: { unmountDocs?: boolean } = {}) {
    const previousViewMode = this.previousStory?.parameters?.docsOnly
      ? 'docs'
      : this.previousSelection?.viewMode;

    if (unmountDocs && previousViewMode === 'docs') {
      (await import('./renderDocs')).unmountDocs(this.view.docsRoot());
    }

    if (this.previousCleanup) {
      await this.previousCleanup();
    }
  }

  renderPreviewEntryError(reason: string, err: Error) {
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
