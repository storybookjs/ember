import global from 'global';
import Events from '@storybook/core-events';
import fetch from 'unfetch';
import * as ReactDOM from 'react-dom';
import { logger } from '@storybook/client-logger';
import { addons } from '@storybook/addons';
import merge from 'lodash/merge';

import { WebPreview } from './WebPreview';
import {
  componentOneExports,
  componentTwoExports,
  importFn,
  globalAnnotations,
  getGlobalAnnotations,
  storiesList,
  emitter,
  mockChannel,
  waitForEvents,
  waitForRender,
  waitForQuiescence,
} from './WebPreview.mockdata';

addons.setChannel(mockChannel as any);

jest.mock('./WebView');
const mockStoriesList = storiesList;
jest.mock('unfetch', () =>
  jest.fn(() => ({
    json: () => mockStoriesList,
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

const createGate = () => {
  let openGate = (_?: any) => {};
  const gate = new Promise<any | undefined>((resolve) => {
    openGate = resolve;
  });
  return { gate, openGate };
};

beforeEach(() => {
  document.location.search = '';
  mockChannel.emit.mockClear();
  emitter.removeAllListeners();
  componentOneExports.default.loaders[0].mockReset().mockImplementation(async () => ({ l: 7 }));
  componentOneExports.default.parameters.docs.container.mockClear();
  componentOneExports.a.play.mockReset();
  globalAnnotations.renderToDOM.mockReset();
  globalAnnotations.render.mockClear();
  globalAnnotations.decorators[0].mockClear();
  // @ts-ignore
  ReactDOM.render.mockReset().mockImplementation((_: any, _2: any, cb: () => any) => cb());
  // @ts-ignore
  logger.warn.mockClear();
});

describe('WebPreview', () => {
  describe('constructor', () => {
    it('shows an error if getGlobalAnnotations throws', async () => {
      const preview = new WebPreview({
        getGlobalAnnotations: () => {
          throw new Error('meta error');
        },
        importFn,
      });

      expect(preview.view.showErrorDisplay).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('fetches the story list', async () => {
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
      expect(fetch).toHaveBeenCalledWith('/stories.json');
    });

    it('sets globals from the URL', async () => {
      document.location.search = '?id=*&globals=a:c';

      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();

      expect(preview.storyStore.globals.get()).toEqual({ a: 'c' });
    });

    it('emits the SET_GLOBALS event', async () => {
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_GLOBALS, {
        globals: { a: 'b' },
        globalTypes: {},
      });
    });

    it('emits the SET_GLOBALS event from the URL', async () => {
      document.location.search = '?id=*&globals=a:c';

      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_GLOBALS, {
        globals: { a: 'c' },
        globalTypes: {},
      });
    });

    it('sets args from the URL', async () => {
      document.location.search = '?id=component-one--a&args=foo:url';

      const preview = new WebPreview({ getGlobalAnnotations, importFn });
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

      const preview = new WebPreview({ getGlobalAnnotations, importFn });
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

      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_SPECIFIED, {
        storyId: 'component-one--a',
        viewMode: 'story',
      });
    });

    it('emits the CURRENT_STORY_WAS_SET event', async () => {
      document.location.search = '?id=component-one--a';

      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.CURRENT_STORY_WAS_SET, {
        storyId: 'component-one--a',
        viewMode: 'story',
      });
    });

    describe('if the story specified does not exist', () => {
      it('renders missing', async () => {
        document.location.search = '?id=random';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.showNoPreview).toHaveBeenCalled();
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'random');
      });

      // TODO we need tests for story list changes
      it.skip('tries again with a specifier if CSF file changes', async () => {
        document.location.search = '?id=component-one--d';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.showNoPreview).toHaveBeenCalled();
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'component-one--d');

        mockChannel.emit.mockClear();
        const newComponentOneExports = merge({}, componentOneExports, {
          d: { args: { foo: 'd' }, play: jest.fn() },
        });
        const newImportFn = jest.fn(async (path) => {
          return path === './src/ComponentOne.stories.js'
            ? newComponentOneExports
            : componentTwoExports;
        });
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_SPECIFIED, {
          storyId: 'component-one--d',
          viewMode: 'story',
        });
      });

      it.skip('DOES NOT try again if CSF file changes if selection changed', async () => {
        document.location.search = '?id=component-one--d';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.showNoPreview).toHaveBeenCalled();
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'component-one--d');

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });

        const newComponentOneExports = merge({}, componentOneExports, {
          d: { args: { foo: 'd' }, play: jest.fn() },
        });
        const newImportFn = jest.fn(async (path) => {
          return path === './src/ComponentOne.stories.js'
            ? newComponentOneExports
            : componentTwoExports;
        });

        preview.onImportFnChanged({ importFn: newImportFn });
        expect(mockChannel.emit).not.toHaveBeenCalledWith(Events.STORY_SPECIFIED, {
          storyId: 'component-one--d',
          viewMode: 'story',
        });
      });

      it.skip('tries again with a specifier if stories list changes', async () => {
        document.location.search = '?id=component-three--d';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.showNoPreview).toHaveBeenCalled();
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'component-three--d');

        // Somehow update story list
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_SPECIFIED, {
          storyId: 'component-three--d',
          viewMode: 'story',
        });
      });
    });

    it('renders missing if no selection', async () => {
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();

      expect(preview.view.showNoPreview).toHaveBeenCalled();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, undefined);
    });

    describe('in story viewMode', () => {
      it('calls view.prepareForStory', async () => {
        document.location.search = '?id=component-one--a';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.prepareForStory).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
          })
        );
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--a',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'a' },
          argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
          args: { foo: 'a' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await waitForRender();

        expect(componentOneExports.default.loaders[0]).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'component-one--a',
            parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
            initialArgs: { foo: 'a' },
            argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
            args: { foo: 'a' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'a' },
              argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
              args: { foo: 'a' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders exception if renderToDOM throws', async () => {
        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce(() => {
          throw error;
        });

        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('renders error if the story calls showError', async () => {
        const error = { title: 'title', description: 'description' };
        globalAnnotations.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        globalAnnotations.renderToDOM.mockImplementationOnce((context) =>
          context.showException(error)
        );

        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await waitForRender();

        expect(componentOneExports.a.play).toHaveBeenCalled();
      });

      it('emits STORY_RENDERED', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
      });
    });

    describe('in docs viewMode', () => {
      it('calls view.prepareForDocs', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';

        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        expect(preview.view.prepareForDocs).toHaveBeenCalled();
      });

      it('render the docs container with the correct context', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';

        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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

        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.DOCS_RENDERED, 'component-one--a');
      });
    });
  });

  describe('onUpdateGlobals', () => {
    it('emits GLOBALS_UPDATED', async () => {
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.GLOBALS_UPDATED, {
        globals: { a: 'b', foo: 'bar' },
        initialGlobals: { a: 'b' },
      });
    });

    it('sets new globals on the store', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();

      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });

      expect(preview.storyStore.globals.get()).toEqual({ a: 'b', foo: 'bar' });
    });

    it('passes new globals in context to renderToDOM', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      globalAnnotations.renderToDOM.mockClear();
      emitter.emit(Events.UPDATE_GLOBALS, { globals: { foo: 'bar' } });
      await waitForRender();

      expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();

      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });

      expect(preview.storyStore.args.get('component-one--a')).toEqual({
        foo: 'a',
        new: 'arg',
      });
    });

    it('passes new args in context to renderToDOM', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      globalAnnotations.renderToDOM.mockClear();
      emitter.emit(Events.UPDATE_STORY_ARGS, {
        storyId: 'component-one--a',
        updatedArgs: { new: 'arg' },
      });
      await waitForRender();

      expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });

        // Now let the loader resolve
        openGate({ l: 8 });
        await waitForRender();

        // Story gets rendered with updated args
        expect(globalAnnotations.renderToDOM).toHaveBeenCalledTimes(1);
        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
        globalAnnotations.renderToDOM.mockImplementationOnce(async () => gate);
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { new: 'arg' },
        });
        expect(logger.warn).toHaveBeenCalled();

        // Now let the renderToDOM call resolve
        openGate();
        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledTimes(1);
        // renderToDOM call happens with original args, does not get retried.
        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
          globalAnnotations.renderToDOM.mockImplementationOnce(() => {
            resolve(null);
          });
        });

        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

        await renderToDOMCalled;
        // Story gets rendered with original args
        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();

        globalAnnotations.renderToDOM.mockClear();

        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });

        // The renderToDOM would have been async so we need to wait a tick.
        await waitForQuiescence();
        expect(globalAnnotations.renderToDOM).not.toHaveBeenCalled();
      });
    });

    describe('when changing story in story viewMode', () => {
      it('updates URL', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
          argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
          args: { foo: 'b' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
            argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
            args: { foo: 'b' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--b',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'b' },
              argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
              args: { foo: 'b' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders exception if renderToDOM throws', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce(() => {
          throw error;
        });

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('renders error if the story calls showError', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = { title: 'title', description: 'description' };
        globalAnnotations.renderToDOM.mockImplementationOnce((context) => context.showError(error));

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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce((context) =>
          context.showException(error)
        );

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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--b');
      });

      it('retains any arg changes', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { foo: 'updated' },
        });
        await waitForRender();
        expect(preview.storyStore.args.get('component-one--a')).toEqual({
          foo: 'updated',
        });

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--b',
          viewMode: 'story',
        });
        await waitForRender();
        expect(preview.storyStore.args.get('component-one--a')).toEqual({
          foo: 'updated',
        });

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();
        expect(preview.storyStore.args.get('component-one--a')).toEqual({
          foo: 'updated',
        });
      });

      describe('while story is still rendering', () => {
        it('stops initial story after loaders if running', async () => {
          const { gate, openGate } = createGate();
          componentOneExports.default.loaders[0].mockImplementationOnce(async () => gate);

          document.location.search = '?id=component-one--a';
          await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

          emitter.emit(Events.SET_CURRENT_STORY, {
            storyId: 'component-one--b',
            viewMode: 'story',
          });
          await waitForRender();

          // Now let the loader resolve
          openGate({ l: 8 });
          await waitForRender();

          // Story gets rendered with updated args
          expect(globalAnnotations.renderToDOM).toHaveBeenCalledTimes(1);
          expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
          globalAnnotations.renderToDOM.mockImplementationOnce(async () => gate);
          await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

          emitter.emit(Events.SET_CURRENT_STORY, {
            storyId: 'component-one--b',
            viewMode: 'story',
          });
          await waitForRender();

          // Now let the renderToDOM call resolve
          openGate();

          expect(globalAnnotations.renderToDOM).toHaveBeenCalledTimes(2);
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
            globalAnnotations.renderToDOM.mockImplementationOnce(() => {
              resolve(null);
            });
          });

          document.location.search = '?id=component-one--a';
          await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

          await renderToDOMCalled;
          // Story gets rendered with original args
          expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
          expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
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
          await waitForQuiescence();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
          argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
          args: { foo: 'a' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
            argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
            args: { foo: 'a' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'a' },
              argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
              args: { foo: 'a' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders exception if renderToDOM throws', async () => {
        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce(() => {
          throw error;
        });

        mockChannel.emit.mockClear();
        emitter.emit(Events.SET_CURRENT_STORY, {
          storyId: 'component-one--a',
          viewMode: 'story',
        });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('renders error if the story calls showError', async () => {
        const error = { title: 'title', description: 'description' };
        globalAnnotations.renderToDOM.mockImplementationOnce((context) => context.showError(error));

        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        globalAnnotations.renderToDOM.mockImplementationOnce((context) =>
          context.showException(error)
        );

        document.location.search = '?id=component-one--a&viewMode=docs';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
        await new WebPreview({ getGlobalAnnotations, importFn }).initialize();
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
      const newComponentOneExports = merge({}, componentOneExports, {
        a: { args: { foo: 'edited' } },
      });
      const newImportFn = jest.fn(async (path) => {
        return path === './src/ComponentOne.stories.js'
          ? newComponentOneExports
          : componentTwoExports;
      });

      it('does not emit STORY_UNCHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).not.toHaveBeenCalledWith(
          Events.STORY_UNCHANGED,
          'component-one--a'
        );
      });

      it('does not emit STORY_CHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).not.toHaveBeenCalledWith(Events.STORY_CHANGED, 'component-one--a');
      });

      it('emits STORY_PREPARED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();
        mockChannel.emit.mockClear();

        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_PREPARED, {
          id: 'component-one--a',
          parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
          initialArgs: { foo: 'edited' },
          argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
          args: { foo: 'edited' },
        });
      });

      it('applies loaders with story context', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
            initialArgs: { foo: 'edited' },
            argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
            args: { foo: 'edited' },
          })
        );
      });

      it('passes loaded context to renderToDOM', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        globalAnnotations.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              parameters: { __isArgsStory: false, docs: { container: expect.any(Function) } },
              globals: { a: 'b' },
              initialArgs: { foo: 'edited' },
              argTypes: { foo: { name: 'foo', type: { name: 'string' } } },
              args: { foo: 'edited' },
              loaded: { l: 7 },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('retains the same delta to the args', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        emitter.emit(Events.UPDATE_STORY_ARGS, {
          storyId: 'component-one--a',
          updatedArgs: { foo: 'updated' },
        });
        await waitForRender();

        mockChannel.emit.mockClear();
        globalAnnotations.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
          expect.objectContaining({
            forceRemount: true,
            storyContext: expect.objectContaining({
              id: 'component-one--a',
              args: { foo: 'updated' },
            }),
          }),
          undefined // this is coming from view.prepareForStory, not super important
        );
      });

      it('renders exception if renderToDOM throws', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce(() => {
          throw error;
        });

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('renders error if the story calls showError', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = { title: 'title', description: 'description' };
        globalAnnotations.renderToDOM.mockImplementationOnce((context) => context.showError(error));

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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        const error = new Error('error');
        globalAnnotations.renderToDOM.mockImplementationOnce((context) =>
          context.showException(error)
        );

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_THREW_EXCEPTION, error);
        expect(preview.view.showErrorDisplay).toHaveBeenCalledWith(error);
      });

      it('executes runPlayFunction', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForRender();

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-one--a');
      });
    });

    describe('when the current story has not changed', () => {
      const newComponentTwoExports = { ...componentTwoExports };
      const newImportFn = jest.fn(async (path) => {
        return path === './src/ComponentOne.stories.js'
          ? componentOneExports
          : newComponentTwoExports;
      });

      it('emits STORY_UNCHANGED', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForEvents([Events.STORY_UNCHANGED]);

        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_UNCHANGED, 'component-one--a');
        expect(mockChannel.emit).not.toHaveBeenCalledWith(Events.STORY_CHANGED, 'component-one--a');
      });

      it('does not re-render the story', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        globalAnnotations.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForQuiescence();

        expect(globalAnnotations.renderToDOM).not.toHaveBeenCalled();
        expect(mockChannel.emit).not.toHaveBeenCalledWith(
          Events.STORY_RENDERED,
          'component-one--a'
        );
      });
    });

    // TODO -- also we need test for when the CSF file no longer exists (story list changed)
    describe('if the story no longer exists', () => {
      const { a, ...componentOneExportsWithoutA } = componentOneExports;
      const newImportFn = jest.fn(async (path) => {
        return path === './src/ComponentOne.stories.js'
          ? componentOneExportsWithoutA
          : componentTwoExports;
      });

      it('renders story missing', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForEvents([Events.STORY_MISSING]);

        expect(preview.view.showNoPreview).toHaveBeenCalled();
        expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_MISSING, 'component-one--a');
      });

      it('does not re-render the story', async () => {
        document.location.search = '?id=component-one--a';
        const preview = new WebPreview({ getGlobalAnnotations, importFn });
        await preview.initialize();
        await waitForRender();

        mockChannel.emit.mockClear();
        globalAnnotations.renderToDOM.mockClear();
        preview.onImportFnChanged({ importFn: newImportFn });
        await waitForQuiescence();

        expect(globalAnnotations.renderToDOM).not.toHaveBeenCalled();
        expect(mockChannel.emit).not.toHaveBeenCalledWith(
          Events.STORY_RENDERED,
          'component-one--a'
        );
      });
    });
  });

  describe('onGetGlobalAnnotationsChanged', () => {
    it('shows an error the new value throws', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      preview.onGetGlobalAnnotationsChanged({
        getGlobalAnnotations: () => {
          throw new Error('error getting meta');
        },
      });

      expect(preview.view.showErrorDisplay).toHaveBeenCalled();
    });

    const newGlobalDecorator = jest.fn((s) => s());
    const newGetGlobalMeta = () => {
      return {
        ...globalAnnotations,
        args: { global: 'added' },
        globals: { a: 'edited' },
        decorators: [newGlobalDecorator],
      };
    };

    it('updates globals to their new values', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      preview.onGetGlobalAnnotationsChanged({ getGlobalAnnotations: newGetGlobalMeta });
      await waitForRender();

      expect(preview.storyStore.globals.get()).toEqual({ a: 'edited' });
    });

    it('updates args to their new values', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      mockChannel.emit.mockClear();
      preview.onGetGlobalAnnotationsChanged({ getGlobalAnnotations: newGetGlobalMeta });

      await waitForRender();

      expect(preview.storyStore.args.get('component-one--a')).toEqual({
        foo: 'a',
        global: 'added',
      });
    });

    it('rerenders the current story with new global meta-generated context', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      globalAnnotations.renderToDOM.mockClear();
      mockChannel.emit.mockClear();
      preview.onGetGlobalAnnotationsChanged({ getGlobalAnnotations: newGetGlobalMeta });
      await waitForRender();

      expect(globalAnnotations.renderToDOM).toHaveBeenCalledWith(
        expect.objectContaining({
          storyContext: expect.objectContaining({
            args: { foo: 'a', global: 'added' },
            globals: { a: 'edited' },
          }),
        }),
        undefined // this is coming from view.prepareForStory, not super important
      );
    });
  });

  describe('onKeydown', () => {
    it('emits PREVIEW_KEYDOWN for regular elements', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
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
