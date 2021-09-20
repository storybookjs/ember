import React, { ComponentType } from 'react';
import ReactDOM from 'react-dom';
import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import Events from '@storybook/core-events';
import { logger } from '@storybook/client-logger';
import global from 'global';
import { addons, Channel } from '@storybook/addons';
import {
  AnyFramework,
  StoryId,
  ProjectAnnotations,
  Args,
  Globals,
  ViewMode,
  StoryContextForLoaders,
} from '@storybook/csf';
import {
  ModuleImportFn,
  Selection,
  Story,
  RenderContext,
  CSFFile,
  StoryStore,
  StorySpecifier,
} from '@storybook/store';

import { WebProjectAnnotations, DocsContextProps } from './types';

import { UrlStore } from './UrlStore';
import { WebView } from './WebView';
import { NoDocs } from './NoDocs';

const { window: globalWindow, AbortController, FEATURES } = global;

function focusInInput(event: Event) {
  const target = event.target as Element;
  return /input|textarea/i.test(target.tagName) || target.getAttribute('contenteditable') !== null;
}

type InitialRenderPhase = 'init' | 'loaded' | 'rendered' | 'done';
type MaybePromise<T> = Promise<T> | T;

export class PreviewWeb<TFramework extends AnyFramework> {
  channel: Channel;

  urlStore: UrlStore;

  storyStore: StoryStore<TFramework>;

  view: WebView;

  renderToDOM: WebProjectAnnotations<TFramework>['renderToDOM'];

  previousSelection: Selection;

  previousStory: Story<TFramework>;

  previousCleanup: () => void;

  constructor({
    importFn,
    fetchStoryIndex,
  }: {
    importFn: ModuleImportFn;
    fetchStoryIndex: ConstructorParameters<typeof StoryStore>[0]['fetchStoryIndex'];
  }) {
    this.channel = addons.getChannel();
    this.view = new WebView();

    this.urlStore = new UrlStore();
    this.storyStore = new StoryStore({ importFn, fetchStoryIndex });

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

  initialize({
    getProjectAnnotations,
    cacheAllCSFFiles = false,
    // We have a second "sync" code path through `initialize` for back-compat reasons.
    // Specifically Storyshots requires the story store to be syncronously loaded completely on bootup
    sync = false,
  }: {
    getProjectAnnotations: () => WebProjectAnnotations<TFramework>;
    cacheAllCSFFiles?: boolean;
    sync?: boolean;
  }): MaybePromise<void> {
    const projectAnnotations = this.getProjectAnnotationsOrRenderError(getProjectAnnotations) || {};

    if (sync) {
      this.storyStore.initialize({ projectAnnotations, cacheAllCSFFiles, sync: true });
      // NOTE: we don't await this, but return the promise so the caller can await it if they want
      return this.setupListenersAndRenderSelection();
    }

    return this.storyStore
      .initialize({ projectAnnotations, cacheAllCSFFiles, sync: false })
      .then(() => this.setupListenersAndRenderSelection());
  }

  getProjectAnnotationsOrRenderError(
    getProjectAnnotations: () => WebProjectAnnotations<TFramework>
  ): ProjectAnnotations<TFramework> | undefined {
    let projectAnnotations;
    try {
      projectAnnotations = getProjectAnnotations();
      this.renderToDOM = projectAnnotations.renderToDOM;
      return projectAnnotations;
    } catch (err) {
      logger.warn(err);
      // This is an error extracting the projectAnnotations (i.e. evaluating the previewEntries) and
      // needs to be show to the user as a simple error
      this.renderPreviewEntryError(err);
      return undefined;
    }
  }

  async setupListenersAndRenderSelection() {
    this.setupListeners();

    const { globals } = this.urlStore.selectionSpecifier || {};
    if (globals) {
      this.storyStore.globals.updateFromPersisted(globals);
    }
    this.channel.emit(Events.SET_GLOBALS, {
      globals: this.storyStore.globals.get() || {},
      globalTypes: this.storyStore.projectAnnotations.globalTypes || {},
    });

    await this.selectSpecifiedStory();

    if (!FEATURES?.storyStoreV7) {
      this.channel.emit(Events.SET_STORIES, await this.storyStore.getSetStoriesPayload());
    }
  }

  setupListeners() {
    globalWindow.onkeydown = this.onKeydown.bind(this);

    this.channel.on(Events.SET_CURRENT_STORY, this.onSetCurrentStory.bind(this));
    this.channel.on(Events.UPDATE_GLOBALS, this.onUpdateGlobals.bind(this));
    this.channel.on(Events.UPDATE_STORY_ARGS, this.onUpdateArgs.bind(this));
    this.channel.on(Events.RESET_STORY_ARGS, this.onResetArgs.bind(this));
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
      this.renderMissingStory(storySpecifier);
      return;
    }

    this.urlStore.setSelection({ storyId, viewMode });
    this.channel.emit(Events.STORY_SPECIFIED, this.urlStore.selection);

    this.channel.emit(Events.CURRENT_STORY_WAS_SET, this.urlStore.selection);

    await this.renderSelection({ persistedArgs: args });
  }

  onKeydown(event: KeyboardEvent) {
    if (!focusInInput(event)) {
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

  // This happens when a glob gets HMR-ed
  async onImportFnChanged({ importFn }: { importFn: ModuleImportFn }) {
    await this.storyStore.onImportFnChanged({ importFn });

    if (this.urlStore.selection) {
      this.renderSelection();
    } else {
      this.selectSpecifiedStory();
    }

    if (!FEATURES?.storyStoreV7) {
      this.channel.emit(Events.SET_STORIES, await this.storyStore.getSetStoriesPayload());
    }
  }

  // This happens when a config file gets reloade
  onGetProjectAnnotationsChanged({
    getProjectAnnotations,
  }: {
    getProjectAnnotations: () => ProjectAnnotations<TFramework>;
  }) {
    const projectAnnotations = this.getProjectAnnotationsOrRenderError(getProjectAnnotations);
    if (!projectAnnotations) {
      return;
    }

    this.storyStore.updateProjectAnnotations(projectAnnotations);
    this.renderSelection();
  }

  // We can either have:
  // - a story selected in "story" viewMode,
  //     in which case we render it to the root element, OR
  // - a story selected in "docs" viewMode,
  //     in which case we render the docsPage for that story
  async renderSelection({ persistedArgs }: { persistedArgs?: Args } = {}) {
    if (!this.urlStore.selection) {
      throw new Error('Cannot render story as no selection was made');
    }

    const { selection } = this.urlStore;

    let story;
    try {
      story = await this.storyStore.loadStory({ storyId: selection.storyId });
    } catch (err) {
      logger.warn(err);
      this.renderMissingStory(selection.storyId);
      return;
    }

    const storyChanged = this.previousSelection?.storyId !== selection.storyId;
    const viewModeChanged = this.previousSelection?.viewMode !== selection.viewMode;

    const implementationChanged =
      !storyChanged && this.previousStory && story !== this.previousStory;

    if (persistedArgs) {
      this.storyStore.args.updateFromPersisted(story, persistedArgs);
    } else if (implementationChanged) {
      this.storyStore.args.resetOnImplementationChange(story, this.previousStory);
    }

    // Don't re-render the story if nothing has changed to justify it
    if (!storyChanged && !implementationChanged && !viewModeChanged) {
      this.channel.emit(Events.STORY_UNCHANGED, selection.storyId);
      return;
    }

    this.cleanupPreviousRender({ unmountDocs: viewModeChanged });

    // If we are rendering something new (as opposed to re-rendering the same or first story), emit
    if (this.previousSelection && (storyChanged || viewModeChanged)) {
      this.channel.emit(Events.STORY_CHANGED, selection.storyId);
    }

    // Record the previous selection *before* awaiting the rendering, in cases things change before it is done.
    this.previousSelection = selection;
    this.previousStory = story;

    const { parameters, initialArgs, argTypes, args } = this.storyStore.getStoryContext(story);
    if (FEATURES?.storyStoreV7) {
      this.channel.emit(Events.STORY_PREPARED, {
        id: story.id,
        parameters,
        initialArgs,
        argTypes,
        args,
      });
    }

    if (selection.viewMode === 'docs' || story.parameters.docsOnly) {
      await this.renderDocs({ story });
    } else {
      this.previousCleanup = this.renderStory({ story });
    }
  }

  async renderDocs({ story }: { story: Story<TFramework> }) {
    const { id, title, name } = story;
    const element = this.view.prepareForDocs();
    const csfFile: CSFFile<TFramework> = await this.storyStore.loadCSFFileByStoryId(id, {
      sync: false,
    });
    const renderingStoryPromises: Promise<void>[] = [];
    const docsContext = {
      id,
      title,
      name,
      // NOTE: these two functions are *sync* so cannot access stories from other CSF files
      storyById: (storyId: StoryId) => this.storyStore.storyFromCSFFile({ storyId, csfFile }),
      componentStories: () => this.storyStore.componentStoriesFromCSFFile({ csfFile }),
      loadStory: (storyId: StoryId) => this.storyStore.loadStory({ storyId }),
      renderStoryToElement: this.renderStoryToElement.bind(this),
      // Keep track of the stories that are rendered by the <Story/> component and don't emit
      // the DOCS_RENDERED event(below) until they have all marked themselves as rendered.
      registerRenderingStory: () => {
        let rendered: (v: void) => void;
        renderingStoryPromises.push(
          new Promise((resolve) => {
            rendered = resolve;
          })
        );
        return rendered;
      },
      getStoryContext: (renderedStory: Story<TFramework>) =>
        ({
          ...this.storyStore.getStoryContext(renderedStory),
          viewMode: 'docs' as ViewMode,
        } as StoryContextForLoaders<TFramework>),
    };

    const { docs } = story.parameters;
    if (docs?.page && !docs?.container) {
      throw new Error('No `docs.container` set, did you run `addon-docs/preset`?');
    }

    const DocsContainer: ComponentType<{ context: DocsContextProps<TFramework> }> =
      docs.container || (({ children }: { children: Element }) => <>{children}</>);
    const Page: ComponentType = docs.page || NoDocs;

    const docsElement = (
      <DocsContainer context={docsContext}>
        <Page />
      </DocsContainer>
    );
    ReactDOM.render(docsElement, element, async () => {
      await Promise.all(renderingStoryPromises);
      this.channel.emit(Events.DOCS_RENDERED, id);
    });
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
      showError: (err: { title: string; description: string }) => this.renderError(err),
      showException: (err: Error) => this.renderException(err),
    };

    return this.renderStoryToElement({ story, renderContext, element });
  }

  // Render a story into a given element and watch for the events that would trigger us
  // to re-render it (plus deal sensibly with things like changing story mid-way through).
  renderStoryToElement({
    story,
    renderContext: renderContextWithoutStoryContext,
    element,
  }: {
    story: Story<TFramework>;
    renderContext: Omit<
      RenderContext<TFramework>,
      'storyContext' | 'storyFn' | 'unboundStoryFn' | 'forceRemount'
    >;
    element: Element;
  }) {
    const { id, applyLoaders, unboundStoryFn, runPlayFunction } = story;

    // IE11 doesn't support AbortController, so we either need to polyfill or just not support it
    const controller = AbortController
      ? new AbortController()
      : {
          signal: { aborted: false },
          abort() {
            this.signal.aborted = true;
          },
        };
    let initialRenderPhase: InitialRenderPhase = 'init';
    let renderContext: RenderContext<TFramework>;
    const initialRender = async () => {
      const storyContext = this.storyStore.getStoryContext(story);

      const viewMode = element === this.view.storyRoot() ? 'story' : 'docs';
      const loadedContext = await applyLoaders({
        ...storyContext,
        viewMode,
      } as StoryContextForLoaders<TFramework>);
      if (controller.signal.aborted) {
        return;
      }
      initialRenderPhase = 'loaded';

      // By this stage, it is possible that new args/globals have been received for this story
      // and we need to ensure we render it with the new values
      const updatedStoryContext = {
        ...loadedContext,
        ...this.storyStore.getStoryContext(story),
      };
      renderContext = {
        ...renderContextWithoutStoryContext,
        // Whenever the selection changes we want to force the component to be remounted.
        forceRemount: true,
        storyContext: updatedStoryContext,
        storyFn: () => unboundStoryFn(updatedStoryContext),
        unboundStoryFn,
      };
      await this.renderToDOM(renderContext, element);

      if (controller.signal.aborted) {
        return;
      }
      initialRenderPhase = 'rendered';

      // NOTE: if the story is torn down during the play function, there could be negative
      // side-effects (as the play function tries to modify something that is no longer visible).
      // In the future we will likely pass the AbortController signal into play(), and also
      // attempt to scope the play function by passing the element.
      //
      // NOTE: it is possible that args/globals have changed in between us starting to render
      // the story and executing the play function (it is also possible that they change mid-way
      // through executing the play function). We explicitly allow such changes to re-render the
      // story by setting `initialRenderDone=true` immediate after `renderToDOM` completes.
      await runPlayFunction();
      if (controller.signal.aborted) {
        return;
      }
      initialRenderPhase = 'done';

      this.channel.emit(Events.STORY_RENDERED, id);
    };

    // Setup a callback to run when the story needs to be re-rendered due to args or globals changes
    // We need to be careful for race conditions if the initial rendering of the story (which
    // can take some time due to loaders + the play function) hasn't completed yet.
    // Our current approach is to either stop, or rerender immediately depending on which phase
    // the initial render is in (see comments below).
    // An alternative approach would be to *wait* until the initial render is done, before
    // re-rendering with the new args. This would be relatively easy if we tracked the initial
    // render via awaiting result of the call to `initialRender`. (We would also need to track
    // if a subsequent *re-render* is in progress, but that is less likely)
    // See also the note about cancelling below.
    const rerenderStory = async () => {
      // The story has not finished rendered the first time. The loaders are still running
      // and we will pick up the new args/globals values when renderToDOM is called.
      if (initialRenderPhase === 'init') {
        return;
      }

      // This story context will have the updated values of args and globals

      const rerenderStoryContext = {
        // NOTE: loaders are not getting run again. So we are just patching
        // the updated story context over the previous value (that included loader output).
        // Loaders aren't allowed to touch anything but the `loaded` key but
        // this means loaders never run again with new values of args/globals
        ...renderContext.storyContext,
        ...this.storyStore.getStoryContext(story),
      };
      const rerenderRenderContext: RenderContext<TFramework> = {
        ...renderContext,
        forceRemount: false,
        storyContext: rerenderStoryContext,
        storyFn: () => unboundStoryFn(rerenderStoryContext),
      };

      try {
        await this.renderToDOM(rerenderRenderContext, element);
      } catch (err) {
        renderContextWithoutStoryContext.showException(err);
        return;
      }
      this.channel.emit(Events.STORY_RENDERED, id);
    };

    // Start the first render
    // NOTE: we don't await here because we need to return the "cleanup" function below
    // right away, so if the user changes story during the first render we can cancel
    // it without having to first wait for it to finish.
    initialRender().catch((err) => renderContextWithoutStoryContext.showException(err));

    // Listen to events and re-render story
    this.channel.on(Events.UPDATE_GLOBALS, rerenderStory);
    this.channel.on(Events.FORCE_RE_RENDER, rerenderStory);
    const rerenderStoryIfMatches = async ({ storyId }: { storyId: StoryId }) => {
      if (storyId === story.id) rerenderStory();
    };
    this.channel.on(Events.UPDATE_STORY_ARGS, rerenderStoryIfMatches);
    this.channel.on(Events.RESET_STORY_ARGS, rerenderStoryIfMatches);

    return () => {
      // If the story is torn down (either a new story is rendered or the docs page removes it)
      // we need to consider the fact that the initial render may not be finished
      // (possibly the loaders or the play function are still running). We use the controller
      // as a method to abort them, ASAP, but this is not foolproof as we cannot control what
      // happens inside the user's code. Still, we do render the new story right away.
      // Alternatively, we could make this function async and await the teardown before rendering
      // the new story. This might be a bit complicated for docs however.
      controller.abort();
      this.storyStore.cleanupStory(story);
      this.channel.off(Events.UPDATE_GLOBALS, rerenderStory);
      this.channel.off(Events.FORCE_RE_RENDER, rerenderStory);
      this.channel.off(Events.UPDATE_STORY_ARGS, rerenderStoryIfMatches);
      this.channel.off(Events.RESET_STORY_ARGS, rerenderStoryIfMatches);
    };
  }

  cleanupPreviousRender({ unmountDocs = true }: { unmountDocs?: boolean } = {}) {
    const previousViewMode = this.previousStory?.parameters?.docsOnly
      ? 'docs'
      : this.previousSelection?.viewMode;

    if (unmountDocs && previousViewMode === 'docs') {
      ReactDOM.unmountComponentAtNode(this.view.docsRoot());
    }

    if (previousViewMode === 'story') {
      this.previousCleanup();
    }
  }

  renderPreviewEntryError(err: Error) {
    this.view.showErrorDisplay(err);
    this.channel.emit(Events.CONFIG_ERROR, err);
  }

  renderMissingStory(storySpecifier?: StorySpecifier) {
    this.cleanupPreviousRender();
    this.view.showNoPreview();
    this.channel.emit(Events.STORY_MISSING, storySpecifier);
  }

  // renderException is used if we fail to render the story and it is uncaught by the app layer
  renderException(err: Error) {
    this.view.showErrorDisplay(err);
    this.channel.emit(Events.STORY_THREW_EXCEPTION, err);

    // Log the stack to the console. So, user could check the source code.
    logger.error(err);
  }

  // renderError is used by the various app layers to inform the user they have done something
  // wrong -- for instance returned the wrong thing from a story
  renderError({ title, description }: { title: string; description: string }) {
    this.channel.emit(Events.STORY_ERRORED, { title, description });
    this.view.showErrorDisplay({
      message: title,
      stack: description,
    });
  }
}
