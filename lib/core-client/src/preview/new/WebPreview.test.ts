import global from 'global';
import Events from '@storybook/core-events';
import { StoriesList } from '@storybook/client-api/dist/ts3.9/new/types';
import fetch from 'unfetch';
import * as ReactDOM from 'react-dom';
import { EventEmitter } from 'events';
import { logger } from '@storybook/client-logger';
import { addons } from '@storybook/addons';

import { WebPreview } from './WebPreview';

const emitter = new EventEmitter();
const mockChannel = {
  on: emitter.on.bind(emitter),
  removeListener: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};
addons.setChannel(mockChannel as any);

jest.mock('./WebView');
jest.mock('unfetch', () =>
  jest.fn(() => ({
    json: () => storiesList,
  }))
);
const { history, document } = global;
jest.mock('global', () => ({
  // @ts-ignore
  ...jest.requireActual('global'),
  history: { replaceState: jest.fn() },
  document: {
    location: {
      pathname: 'pathname',
      search: '?id=*',
    },
  },
}));

jest.mock('@storybook/client-logger');
jest.mock('react-dom');

const waitForEvents = (events: string[]) => {
  // We've already emitted a render event. NOTE if you want to test a second call,
  // ensure you call `mockChannel.emit.mockClear()` before `waitForRender`
  if (mockChannel.emit.mock.calls.find((call) => events.includes(call[0]))) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    mockChannel.emit.mockImplementation((event) => {
      if (events.includes(event)) {
        resolve(null);
      }
    });

    // Don't wait too long
    setTimeout(() => reject(new Error('Event was not emitted in time')), 100);
  });
};

// The functions on the preview that trigger rendering don't wait for
// the async parts, so we need to listen for the "done" events
const waitForRender = () =>
  waitForEvents([
    Events.STORY_RENDERED,
    Events.DOCS_RENDERED,
    Events.STORY_THREW_EXCEPTION,
    Events.STORY_ERRORED,
  ]);

const createGate = () => {
  let openGate = (_?: any) => {};
  const gate = new Promise<any | undefined>((resolve) => {
    openGate = resolve;
  });
  return { gate, openGate };
};

const componentOneExports = {
  default: {
    title: 'Component One',
    argTypes: {
      foo: { type: { name: 'string' } },
    },
    loaders: [jest.fn()],
    parameters: {
      docs: { container: jest.fn() },
    },
  },
  a: { args: { foo: 'a' }, play: jest.fn() },
  b: { args: { foo: 'b' }, play: jest.fn() },
};
const componentTwoExports = {
  default: { title: 'Component Two' },
  c: { args: { foo: 'c' } },
};
const importFn = jest.fn(async (path) => {
  return path === './src/ComponentOne.stories.js' ? componentOneExports : componentTwoExports;
});

const globalMeta = {
  globals: { a: 'b' },
  globalTypes: {},
  render: jest.fn(),
  renderToDOM: jest.fn(),
};
const getGlobalMeta = () => globalMeta;

const storiesList: StoriesList = {
  v: 3,
  stories: {
    'component-one--a': {
      title: 'Component One',
      name: 'A',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-one--b': {
      title: 'Component One',
      name: 'B',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-two--c': {
      title: 'Component Two',
      name: 'C',
      importPath: './src/ComponentTwo.stories.js',
    },
  },
};

beforeEach(() => {
  document.location.search = '';
  mockChannel.emit.mockClear();
  emitter.removeAllListeners();
  componentOneExports.default.loaders[0].mockReset().mockImplementation(async () => ({ l: 7 }));
  componentOneExports.default.parameters.docs.container.mockClear();
  componentOneExports.a.play.mockReset();
  globalMeta.renderToDOM.mockReset();
  // @ts-ignore
  ReactDOM.render.mockReset().mockImplementation((_: any, _2: any, cb: () => any) => cb());
  // @ts-ignore
  logger.warn.mockClear();
});

describe('WebPreview', () => {
  describe('constructor', () => {
    it('shows an error if getGlobalMeta throws', async () => {
      const preview = new WebPreview({
        getGlobalMeta: () => {
          throw new Error('meta error');
        },
        importFn,
      });

      expect(preview.view.showErrorDisplay).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('fetches the story list', async () => {
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      expect(fetch).toHaveBeenCalledWith('/stories.json');
    });

    it('sets globals from the URL', async () => {
      document.location.search = '?id=*&globals=a:c';

      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      expect(preview.storyStore.globals.get()).toEqual({ a: 'c' });
    });

    it('emits the SET_GLOBALS event', async () => {
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_GLOBALS, {
        globals: { a: 'b' },
        globalTypes: {},
      });
    });

    it('emits the SET_GLOBALS event from the URL', async () => {
      document.location.search = '?id=*&globals=a:c';

      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_GLOBALS, {
        globals: { a: 'c' },
        globalTypes: {},
      });
    });

    it('sets args from the URL', async () => {
      document.location.search = '?id=component-one--a&args=foo:url';

      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      expect(preview.storyStore.args.get('component-one--a')).toEqual({
        foo: 'url',
      });
    });

    // TODO
    // it('emits SET_STORIES if configured', async () => { });
  });

  describe('initial selection', () => {
    it('selects the story specified in the URL', async () => {
      document.location.search = '?id=component-one--a';

      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      expect(preview.urlStore.selection).toEqual({
        storyId: 'component-one--a',
        viewMode: 'story',
      });
      expect(history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'pathname?id=component-one--a&viewMode=story'
      );
    });

    it('emits the STORY_SPECIFIED event', async () => {
      document.location.search = '?id=component-one--a';

      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_SPECIFIED, {
        storyId: 'component-one--a',
        viewMode: 'story',
      });
    });

    it('emits the CURRENT_STORY_WAS_SET event', async () => {
      document.location.search = '?id=component-one--a';

      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.CURRENT_STORY_WAS_SET, {
        storyId: 'component-one--a',
        viewMode: 'story',
      });
    });

    it('renders missing if the story specified does not exist', async () => {
      document.location.search = '?id=random';

      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      expect(preview.view.showNoPreview).toHaveBeenCalled();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'random');
    });

    it('renders missing if no selection', async () => {
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      expect(preview.view.showNoPreview).toHaveBeenCalled();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, undefined);
    });

    describe('in story viewMode', () => {
      it('calls view.prepareForStory', async () => {
        document.location.search = '?id=component-one--a';

        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        expect(preview.view.prepareForStory).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
          })
        );
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--a',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'a' },
          argTypes: { foo: { type: { name: 'string' } } },
          args: { foo: 'a' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(componentOneExports.default.loaders[0]).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
            parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
            initialArgs: { foo: 'a' },
            argTypes: { foo: { type: { name: 'string' } } },
            args: { foo: 'a' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'a' },
              argTypes: { foo: { type: { name: 'string' } } },
              args: { foo: 'a' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders error if the story calls showError', async () => {
        const error = { title: 'title', description: 'description' };
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ERRORED, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith({
          message: error.title,
          stack: error.description,
        });
      });

      it('renders exception if the story calls showException', async () => {
        const error = new Error('error');
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showException(error));

        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(componentOneExports.a.play).toHaveBeenCalled();
      });

      it('emits STORY_RENDERED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
      });
    });

    describe('in docs viewMode', () => {
      it('calls view.prepareForDocs', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';

        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        expect(preview.view.prepareForDocs).toHaveBeenCalled();
      });

      it('render the docs container with the correct context', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';

        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(ReactDOM.render).toHaveBeenCalledWith(
          expect.objectContaining({
            type: componentOneExports.default.parameters.docs.container,
            props: expect.objectContaining({
              context: expect.objectContaining({
                id: 'component-one--a',
                title: 'Component One',
                name: 'A',
              }),
            }),
          }),
          undefined,
          expect.any(Function)
        );
      });

      it('emits DOCS_RENDERED', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';

        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.DOCS_RENDERED, 'component-one--a');
      });
    });
  });

  describe('onUpdateGlobals', () => {
    it('emits GLOBALS_UPDATED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.GLOBALS_UPDATED, {
        globals: { a: 'b', foo: 'bar' },
        initialGlobals: { a: 'b' },
      });
    });

    it('sets new globals on the store', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });

      expect(preview.storyStore.globals.get()).toEqual({ a: 'b', foo: 'bar' });
    });

    it('passes new globals in context to renderToDOM', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      globalMeta.renderToDOM.mockClear();
      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });
      await waitForRender();

      expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
        expect.objectContaining({
          forceRemount: false,
          storyContext: expect.objectContaining({
            globals: { a: 'b', foo: 'bar' },
          }),
        }),
        undefined // this is coming from view.prepareForStory, not super important
      );
    });

    it('emits STORY_RENDERED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });
      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
    });
  });

  describe('onUpdateArgs', () => {
    it('emits STORY_ARGS_UPDATED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, {
        storyId: 'component-one--a',
        args: { foo: 'a', new: 'arg' },
      });
    });

    it('sets new args on the store', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });

      expect(preview.storyStore.args.get('component-one--a')).toEqual({ foo: 'a', new: 'arg' });
    });

    it('passes new args in context to renderToDOM', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      globalMeta.renderToDOM.mockClear();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });
      await waitForRender();

      expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
        expect.objectContaining({
          forceRemount: false,
          storyContext: expect.objectContaining({
            initialArgs: { foo: 'a' },
            args: { foo: 'a', new: 'arg' },
          }),
        }),
        undefined // this is coming from view.prepareForStory, not super important
      );
    });

    it('emits STORY_RENDERED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });
      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
    });

    describe('while story is still rendering', () => {
      it('silently changes args if still running loaders', async () => {
        const { gate, openGate } = createGate();

        document.location.search = '?id=component-one--a';
        componentOneExports.default.loaders[0].mockImplementationOnce(async () => gate);
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });

        // Now let the loader resolve
        openGate({ l: 8 });
        await waitForRender();

        // Story gets rendered with updated args
        expect(globalMeta.renderToDOM).toHaveBeenCalledTimes(1);
        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              loaded: { l: 8 },
              args: { foo: 'a', new: 'arg' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('does nothing and warns renderToDOM is running', async () => {
        const { gate, openGate } = createGate();

        document.location.search = '?id=component-one--a';
        globalMeta.renderToDOM.mockImplementationOnce(async () => gate);
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });
        expect(logger.warn).toHaveBeenCalled();

        // Now let the renderToDOM call resolve
        openGate();
        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledTimes(1);
        // renderToDOM call happens with original args, does not get retried.
        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              loaded: { l: 7 },
              args: { foo: 'a' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('warns and calls renderToDOM again if play function is running', async () => {
        const { gate, openGate } = createGate();
        componentOneExports.a.play.mockImplementationOnce(async () => gate);

        const renderToDOMCalled = new Promise((resolve) => {
          globalMeta.renderToDOM.mockImplementationOnce(() => {
            resolve(null);
          });
        });

        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        await renderToDOMCalled;
        // Story gets rendered with original args
        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              loaded: { l: 7 },
              args: { foo: 'a' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });
        expect(logger.warn).toHaveBeenCalled();

        // The second call should emit STORY_RENDERED
        await waitForRender();

        // Story gets rendered with updated args
        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: false,
            storyContext: expect.objectContaining({
              loaded: { l: 7 },
              args: { foo: 'a', new: 'arg' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );

        // Now let the runPlayFunction call resolve
        openGate();
      });
    });
  });

  describe('onResetArgs', () => {
    it('resetStoryArgs emits STORY_ARGS_UPDATED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      mockChannel.emit.mockClear();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { foo: 'new' },
      });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, {
        storyId: 'component-one--a',
        args: { foo: 'new' },
      });

      mockChannel.emit.mockClear();
      emitter.emit(Events.RESET_STORY_ARGS, {
        storyId: 'component-one--a',
        argNames: ['foo'],
      });

      await waitForEvents([Events.STORY_ARGS_UPDATED]);

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, {
        storyId: 'component-one--a',
        args: { foo: 'a' },
      });
    });

    it('resetStoryArgs resets a single arg', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      mockChannel.emit.mockClear();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { foo: 'new', new: 'value' },
      });

      mockChannel.emit.mockClear();
      emitter.emit(Events.RESET_STORY_ARGS, {
        storyId: 'component-one--a',
        argNames: ['foo'],
      });

      await waitForEvents([Events.STORY_ARGS_UPDATED]);

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, {
        storyId: 'component-one--a',
        args: { foo: 'a', new: 'value' },
      });
    });

    it('resetStoryArgs resets all args', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { foo: 'new', new: 'value' },
      });

      mockChannel.emit.mockClear();
      emitter.emit(Events.RESET_STORY_ARGS, {
        storyId: 'component-one--a',
      });

      await waitForEvents([Events.STORY_ARGS_UPDATED]);

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ARGS_UPDATED, {
        storyId: 'component-one--a',
        args: { foo: 'a' },
      });
    });
  });

  describe('onSetCurrentStory', () => {
    it('updates URL', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      emitter.emit(Events.SET_CURRENT_STORY, {
        storyId: 'component-one--b',
        viewMode: 'story',
      });

      expect(history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'pathname?id=component-one--b&viewMode=story'
      );
    });

    it('emits CURRENT_STORY_WAS_SET', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      emitter.emit(Events.SET_CURRENT_STORY, {
        storyId: 'component-one--b',
        viewMode: 'story',
      });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.CURRENT_STORY_WAS_SET, {
        storyId: 'component-one--b',
        viewMode: 'story',
      });
    });

    it('renders missing if the story specified does not exist', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      emitter.emit(Events.SET_CURRENT_STORY, {
        storyId: 'random',
        viewMode: 'story',
      });

      await waitForEvents([Events.STORY_MISSING]);
      expect(preview.view.showNoPreview).toHaveBeenCalled();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'random');
    });

    describe('if the selection is unchanged', () => {
      it('emits STORY_UNCHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        await waitForEvents([Events.STORY_UNCHANGED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_UNCHANGED, 'component-one--a');
      });

      it('does NOT call renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();

        globalMeta.renderToDOM.mockClear();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        // The renderToDOM would have been async so we need to wait a tick.
        await new Promise((r) => setTimeout(r, 100));
        expect(globalMeta.renderToDOM).not.toHaveBeenCalled();
      });
    });

    describe('when changing story in story viewMode', () => {
      it('updates URL', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });

        expect(history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          'pathname?id=component-one--b&viewMode=story'
        );
      });

      it('emits STORY_CHANGED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });

        await waitForEvents([Events.STORY_CHANGED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_CHANGED, 'component-one--b');
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });

        await waitForEvents([Events.STORY_PREPARED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--b',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'b' },
          argTypes: { foo: { type: { name: 'string' } } },
          args: { foo: 'b' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });

        await waitForRender();
        expect(componentOneExports.default.loaders[0]).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--b',
            parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
            initialArgs: { foo: 'b' },
            argTypes: { foo: { type: { name: 'string' } } },
            args: { foo: 'b' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--b',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'b' },
              argTypes: { foo: { type: { name: 'string' } } },
              args: { foo: 'b' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders error if the story calls showError', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        const error = { title: 'title', description: 'description' };
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ERRORED, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith({
          message: error.title,
          stack: error.description,
        });
      });

      it('renders exception if the story calls showException', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showException(error));

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(componentOneExports.b.play).toHaveBeenCalled();
      });

      it('emits STORY_RENDERED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--b');
      });

      describe('while story is still rendering', () => {
        it('stops initial story after loaders if running', async () => {
          const { gate, openGate } = createGate();
          componentOneExports.default.loaders[0].mockImplementationOnce(async () => gate);

          document.location.search = '?id=component-one--a';
          await new WebPreview({ getGlobalMeta, importFn }).initialize();

          emitter.emit(Events.SET_CURRENT_STORY, {
            storyId: 'component-one--b',
            viewMode: 'story',
          });
          await waitForRender();

          // Now let the loader resolve
          openGate({ l: 8 });
          await waitForRender();

          // Story gets rendered with updated args
          expect(globalMeta.renderToDOM).toHaveBeenCalledTimes(1);
          expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
            expect.objectContaining({
              forceRemount: true,
              storyContext: expect.objectContaining({
                id: 'component-one--b',
                loaded: { l: 7 },
              }),
            }),
            undefined // this is coming from view.prepareForStory, not super important
          );
        });

        it('stops initial story after renderToDOM if running', async () => {
          const { gate, openGate } = createGate();

          document.location.search = '?id=component-one--a';
          globalMeta.renderToDOM.mockImplementationOnce(async () => gate);
          await new WebPreview({ getGlobalMeta, importFn }).initialize();

          emitter.emit(Events.SET_CURRENT_STORY, {
            storyId: 'component-one--b',
            viewMode: 'story',
          });
          await waitForRender();

          // Now let the renderToDOM call resolve
          openGate();

          expect(globalMeta.renderToDOM).toHaveBeenCalledTimes(2);
          expect(componentOneExports.a.play).not.toHaveBeenCalled();
          expect(componentOneExports.b.play).toHaveBeenCalled();

          expect(mockChannel.emit).not.toHaveBeenCalledWith(
            Events.STORY_RENDERED,
            'component-one--a'
          );
          expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--b');
        });

        it('stops initial story after runPlayFunction if running', async () => {
          const { gate, openGate } = createGate();
          componentOneExports.a.play.mockImplementationOnce(async () => gate);

          const renderToDOMCalled = new Promise((resolve) => {
            globalMeta.renderToDOM.mockImplementationOnce(() => {
              resolve(null);
            });
          });

          document.location.search = '?id=component-one--a';
          await new WebPreview({ getGlobalMeta, importFn }).initialize();

          await renderToDOMCalled;
          // Story gets rendered with original args
          expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
            expect.objectContaining({
              forceRemount: true,
              storyContext: expect.objectContaining({
                id: 'component-one--a',
                loaded: { l: 7 },
              }),
            }),
            undefined // this is coming from view.prepareForStory, not super important
          );

          emitter.emit(Events.SET_CURRENT_STORY, {
            storyId: 'component-one--b',
            viewMode: 'story',
          });
          await waitForRender();

          // New story gets rendered, (play function is still running)
          expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
            expect.objectContaining({
              forceRemount: true,
              storyContext: expect.objectContaining({
                id: 'component-one--b',
                loaded: { l: 7 },
              }),
            }),
            undefined // this is coming from view.prepareForStory, not super important
          );

          // Now let the runPlayFunction call resolve
          openGate();

          // Final story rendered is not emitted for the first story
          await new Promise((r) => setTimeout(r, 100));
          expect(mockChannel.emit).not.toHaveBeenCalledWith(
            Events.STORY_RENDERED,
            'component-one--a'
          );
        });
      });
    });

    describe('when changing from story viewMode to docs', () => {
      it('updates URL', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'docs',
        });

        expect(history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          'pathname?id=component-one--a&viewMode=docs'
        );
      });

      it('emits STORY_CHANGED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'docs',
        });

        await waitForEvents([Events.STORY_CHANGED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_CHANGED, 'component-one--a');
      });

      it('calls view.prepareForDocs', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'docs',
        });
        await waitForRender();

        expect(preview.view.prepareForDocs).toHaveBeenCalled();
      });

      it('render the docs container with the correct context', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'docs',
        });
        await waitForRender();

        expect(ReactDOM.render).toHaveBeenCalledWith(
          expect.objectContaining({
            type: componentOneExports.default.parameters.docs.container,
            props: expect.objectContaining({
              context: expect.objectContaining({
                id: 'component-one--a',
                title: 'Component One',
                name: 'A',
              }),
            }),
          }),
          undefined,
          expect.any(Function)
        );
      });

      it('emits DOCS_RENDERED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'docs',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.DOCS_RENDERED, 'component-one--a');
      });
    });

    describe('when changing from docs viewMode to story', () => {
      it('updates URL', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        expect(history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          'pathname?id=component-one--a&viewMode=story'
        );
      });

      it('unmounts docs', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalled();
      });

      // NOTE: I am not sure this entirely makes sense but this is the behaviour from 6.3
      it('emits STORY_CHANGED', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        await waitForEvents([Events.STORY_CHANGED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_CHANGED, 'component-one--a');
      });

      it('calls view.prepareForStory', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(preview.view.prepareForStory).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
          })
        );
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        //  TODO: not sure if thes event makes sense here either
        await waitForEvents([Events.STORY_PREPARED]);
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--a',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'a' },
          argTypes: { foo: { type: { name: 'string' } } },
          args: { foo: 'a' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        await waitForRender();
        expect(componentOneExports.default.loaders[0]).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
            parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
            initialArgs: { foo: 'a' },
            argTypes: { foo: { type: { name: 'string' } } },
            args: { foo: 'a' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'a' },
              argTypes: { foo: { type: { name: 'string' } } },
              args: { foo: 'a' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders error if the story calls showError', async () => {
        const error = { title: 'title', description: 'description' };
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ERRORED, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith({
          message: error.title,
          stack: error.description,
        });
      });

      it('renders exception if the story calls showException', async () => {
        const error = new Error('error');
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showException(error));

        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(componentOneExports.a.play).toHaveBeenCalled();
      });

      it('emits STORY_RENDERED', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalMeta, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
      });
    });
  });

  describe('onImportFnChanged', () => {
    describe('when the current story changes', () => {
      const newComponentOneExports = { ...componentOneExports };
      const newImportFn = jest.fn(async (path) => {
        return path === './src/ComponentOne.stories.js'
          ? newComponentOneExports
          : componentTwoExports;
      });

      it('does not emit STORY_UNCHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).not.toHaveBeenCalledWith(Events.STORY_UNCHANGED);
      });

      it('does not emit STORY_CHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).not.toHaveBeenCalledWith(Events.STORY_CHANGED);
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--a',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'a' },
          argTypes: { foo: { type: { name: 'string' } } },
          args: { foo: 'a' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        componentOneExports.default.loaders[0].mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(componentOneExports.default.loaders[0]).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
            parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
            initialArgs: { foo: 'a' },
            argTypes: { foo: { type: { name: 'string' } } },
            args: { foo: 'a' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        globalMeta.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'a' },
              argTypes: { foo: { type: { name: 'string' } } },
              args: { foo: 'a' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      // TODO -- is this actually what we want?
      it('retains the stories args', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });
        await waitForRender();

        mockChannel.emit.mockClear();
        globalMeta.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(globalMeta.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              args: { foo: 'a', new: 'arg' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders error if the story calls showError', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        const error = { title: 'title', description: 'description' };
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_ERRORED, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith({
          message: error.title,
          stack: error.description,
        });
      });

      it('renders exception if the story calls showException', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalMeta.renderToDOM.mockImplementationOnce((context) => context.showException(error));

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        componentOneExports.a.play.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(componentOneExports.a.play).toHaveBeenCalled();
      });

      it('emits STORY_RENDERED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalMeta, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
      });
    });

    it.skip('re-imports and processes the current story, if it is new', async () => {});
    it.skip('re-imports but does not process the current story, if it is the same', async () => {});
    it.skip('renders missing it the current story no longer exists', async () => {});
    it.skip('renders missing it the current CSF file no longer exists', async () => {});
  });

  describe('onGetGlobalMetaChanged', () => {
    it.skip('shows an error the new value throws', async () => {});
    it.skip('updates globals to their new values', async () => {});
    it.skip('updates args to their new values', async () => {});
    it.skip('rerenders the current story with new global meta-generated context', async () => {});
  });

  describe('onKeydown', () => {
    it('emits PREVIEW_KEYDOWN for regular elements', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      preview.onKeydown({
        target: { tagName: 'div', getAttribute: jest.fn().mockReturnValue(null) },
      } as any);

      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.PREVIEW_KEYDOWN,
        expect.objectContaining({})
      );
    });

    it('does not emit PREVIEW_KEYDOWN for input elements', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();

      preview.onKeydown({
        target: { tagName: 'input', getAttribute: jest.fn().mockReturnValue(null) },
      } as any);

      expect(mockChannel.emit).not.toHaveBeenCalledWith(
        Events.PREVIEW_KEYDOWN,
        expect.objectContaining({})
      );
    });
  });
});
