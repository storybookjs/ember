import Events from '@storybook/core-events';

import {
  waitForRender,
  waitForEvents,
  emitter,
  mockChannel,
} from '@storybook/preview-web/dist/cjs/PreviewWeb.mockdata';

import { start } from './start';

jest.mock('@storybook/preview-web/dist/cjs/WebView');

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
  FEATURES: {
    breakingChangesV7: true,
  },
}));

jest.mock('@storybook/channel-postmessage', () => () => mockChannel);
jest.mock('react-dom');

// for the auto-title test
jest.mock('@storybook/store', () => {
  const actualStore = jest.requireActual('@storybook/store');
  return {
    ...actualStore,
    autoTitle: () => 'auto-title',
  };
});

beforeEach(() => {
  mockChannel.emit.mockClear();
  // Preview doesn't clean itself up as it isn't designed to ever be stopped :shrug:
  emitter.removeAllListeners();
});

describe('start', () => {
  describe('when configure is called with storiesOf only', () => {
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' } as NodeModule)
          .add('Story One', jest.fn())
          .add('Story Two', jest.fn());

        clientApi
          .storiesOf('Component B', { id: 'file2' } as NodeModule)
          .add('Story Three', jest.fn());
      });

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
            "Component B": Object {},
          },
          "stories": Object {
            "component-a--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--story-one",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "Story One",
              "parameters": Object {
                "__id": "component-a--story-one",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-a--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--story-two",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "Story Two",
              "parameters": Object {
                "__id": "component-a--story-two",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-b--story-three": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-b",
              "id": "component-b--story-three",
              "initialArgs": Object {},
              "kind": "Component B",
              "name": "Story Three",
              "parameters": Object {
                "__id": "component-b--story-three",
                "__isArgsStory": false,
                "fileName": "file2",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Three",
              "subcomponents": undefined,
              "title": "Component B",
            },
          },
          "v": 2,
        }
      `);

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-a--story-one'
      );

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'component-a--story-one',
        }),
        undefined
      );
    });

    it('sends over docs only stories', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' } as NodeModule)
          .add('Story One', jest.fn(), { docsOnly: true, docs: {} });
      });

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
          },
          "stories": Object {
            "component-a--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--story-one",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "Story One",
              "parameters": Object {
                "__id": "component-a--story-one",
                "__isArgsStory": false,
                "docs": Object {},
                "docsOnly": true,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component A",
            },
          },
          "v": 2,
        }
      `);
    });

    it('deals with stories with "default" name', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('default', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
    });

    it('deals with stories with camel-cased names', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' } as NodeModule)
          .add('storyOne', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--storyone');
    });

    it('deals with stories with spaces in the name', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' } as NodeModule)
          .add('Story One', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-a--story-one'
      );
    });

    // https://github.com/storybookjs/storybook/issues/16303
    it('deals with stories with numeric names', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('story0', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--story0');
    });

    it('deals with storiesOf from the same file twice', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('default', jest.fn());
        clientApi.storiesOf('Component B', { id: 'file1' } as NodeModule).add('default', jest.fn());
        clientApi.storiesOf('Component C', { id: 'file1' } as NodeModule).add('default', jest.fn());
      });

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');

      const storiesOfData = mockChannel.emit.mock.calls.find(
        (call: [string, any]) => call[0] === Events.SET_STORIES
      )[1];
      expect(Object.values(storiesOfData.stories).map((s: any) => s.parameters.fileName)).toEqual([
        'file1',
        'file1-2',
        'file1-3',
      ]);
    });

    it('allows global metadata via client-api', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      const { configure, clientApi } = start(render);

      const loader = jest.fn(async () => ({ val: 'loaded' }));
      const decorator = jest.fn();
      configure('test', () => {
        clientApi.addLoader(loader);
        clientApi.addDecorator(decorator);
        clientApi.addParameters({ param: 'global' });
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('default', jest.fn());
      });

      await waitForRender();

      expect(loader).toHaveBeenCalled();
      expect(decorator).toHaveBeenCalled();
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          storyContext: expect.objectContaining({
            parameters: expect.objectContaining({
              framework: 'test',
              param: 'global',
            }),
          }),
        }),
        undefined
      );
    });

    it('supports forceRerender()', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      const { configure, clientApi, forceReRender } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('default', jest.fn());
      });

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');

      mockChannel.emit.mockClear();
      forceReRender();

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
    });

    it('supports HMR when a story file changes', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      const { configure, clientApi, forceReRender } = start(render);

      let disposeCallback: () => void;
      const module = {
        id: 'file1',
        hot: {
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      const firstImplementation = jest.fn();
      configure('test', () => {
        clientApi.storiesOf('Component A', module as any).add('default', firstImplementation);
      });

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
      expect(firstImplementation).toHaveBeenCalled();
      expect(module.hot.accept).toHaveBeenCalled();
      expect(disposeCallback).toBeDefined();

      mockChannel.emit.mockClear();
      disposeCallback();
      const secondImplementation = jest.fn();
      clientApi.storiesOf('Component A', module as any).add('default', secondImplementation);

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
      expect(secondImplementation).toHaveBeenCalled();
    });

    it('re-emits SET_STORIES when a story is added', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      const { configure, clientApi, forceReRender } = start(render);

      let disposeCallback: () => void;
      const module = {
        id: 'file1',
        hot: {
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      configure('test', () => {
        clientApi.storiesOf('Component A', module as any).add('default', jest.fn());
      });

      await waitForRender();

      mockChannel.emit.mockClear();
      disposeCallback();
      clientApi
        .storiesOf('Component A', module as any)
        .add('default', jest.fn())
        .add('new', jest.fn());

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
          },
          "stories": Object {
            "component-a--default": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--default",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "__id": "component-a--default",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "default",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-a--new": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--new",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "new",
              "parameters": Object {
                "__id": "component-a--new",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "new",
              "subcomponents": undefined,
              "title": "Component A",
            },
          },
          "v": 2,
        }
      `);
    });

    it('re-emits SET_STORIES when a story file is removed', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      const { configure, clientApi, forceReRender } = start(render);

      let disposeCallback: () => void;
      const moduleB = {
        id: 'file2',
        hot: {
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as any).add('default', jest.fn());
        clientApi.storiesOf('Component B', moduleB as any).add('default', jest.fn());
      });

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
            "Component B": Object {},
          },
          "stories": Object {
            "component-a--default": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--default",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "__id": "component-a--default",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "default",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-b--default": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-b",
              "id": "component-b--default",
              "initialArgs": Object {},
              "kind": "Component B",
              "name": "default",
              "parameters": Object {
                "__id": "component-b--default",
                "__isArgsStory": false,
                "fileName": "file2",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "default",
              "subcomponents": undefined,
              "title": "Component B",
            },
          },
          "v": 2,
        }
      `);
      mockChannel.emit.mockClear();
      disposeCallback();

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
          },
          "stories": Object {
            "component-a--default": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--default",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "__id": "component-a--default",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "default",
              "subcomponents": undefined,
              "title": "Component A",
            },
          },
          "v": 2,
        }
      `);
    });
  });

  const componentCExports = {
    default: {
      title: 'Component C',
    },
    StoryOne: jest.fn(),
    StoryTwo: jest.fn(),
  };

  describe('when configure is called with CSF only', () => {
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure } = start(render);
      configure('test', () => [componentCExports]);

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component C": Object {},
          },
          "stories": Object {
            "component-c--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-one",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-two",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component C",
            },
          },
          "v": 2,
        }
      `);

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-c--story-one'
      );

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'component-c--story-one',
        }),
        undefined
      );
    });

    it('supports HMR when a story file changes', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      let disposeCallback: (data: object) => void;
      const module = {
        id: 'file1',
        hot: {
          data: {},
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };

      const { configure } = start(render);
      configure('test', () => [componentCExports], module as any);

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-c--story-one'
      );
      expect(componentCExports.StoryOne).toHaveBeenCalled();
      expect(module.hot.accept).toHaveBeenCalled();
      expect(disposeCallback).toBeDefined();

      mockChannel.emit.mockClear();
      disposeCallback(module.hot.data);
      const secondImplementation = jest.fn();
      configure(
        'test',
        () => [{ ...componentCExports, StoryOne: secondImplementation }],
        module as any
      );

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-c--story-one'
      );
      expect(secondImplementation).toHaveBeenCalled();
    });

    it('re-emits SET_STORIES when a story is added', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      let disposeCallback: (data: object) => void;
      const module = {
        id: 'file1',
        hot: {
          data: {},
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      const { configure } = start(render);
      configure('test', () => [componentCExports], module as any);

      await waitForRender();

      mockChannel.emit.mockClear();
      disposeCallback(module.hot.data);
      configure('test', () => [{ ...componentCExports, StoryThree: jest.fn() }], module as any);

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component C": Object {},
          },
          "stories": Object {
            "component-c--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-one",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-three": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-three",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Three",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Three",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-two",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component C",
            },
          },
          "v": 2,
        }
      `);
    });

    it('re-emits SET_STORIES when a story file is removed', async () => {
      const render = jest.fn(({ storyFn }) => storyFn());

      let disposeCallback: (data: object) => void;
      const module = {
        id: 'file1',
        hot: {
          data: {},
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      const { configure } = start(render);
      configure(
        'test',
        () => [componentCExports, { default: { title: 'Component D' }, StoryFour: jest.fn() }],
        module as any
      );

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component C": Object {},
            "Component D": Object {},
          },
          "stories": Object {
            "component-c--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-one",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-two",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-d--story-four": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-d",
              "id": "component-d--story-four",
              "initialArgs": Object {},
              "kind": "Component D",
              "name": "Story Four",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Four",
              "subcomponents": undefined,
              "title": "Component D",
            },
          },
          "v": 2,
        }
      `);

      mockChannel.emit.mockClear();
      disposeCallback(module.hot.data);
      configure('test', () => [componentCExports], module as any);

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component C": Object {},
          },
          "stories": Object {
            "component-c--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-one",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-two",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component C",
            },
          },
          "v": 2,
        }
      `);
    });
  });

  describe('when configure is called with a combination', () => {
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);
      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' } as NodeModule)
          .add('Story One', jest.fn())
          .add('Story Two', jest.fn());

        clientApi
          .storiesOf('Component B', { id: 'file2' } as NodeModule)
          .add('Story Three', jest.fn());

        return [componentCExports];
      });

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component A": Object {},
            "Component B": Object {},
            "Component C": Object {},
          },
          "stories": Object {
            "component-a--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--story-one",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "Story One",
              "parameters": Object {
                "__id": "component-a--story-one",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-a--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-a",
              "id": "component-a--story-two",
              "initialArgs": Object {},
              "kind": "Component A",
              "name": "Story Two",
              "parameters": Object {
                "__id": "component-a--story-two",
                "__isArgsStory": false,
                "fileName": "file1",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component A",
            },
            "component-b--story-three": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-b",
              "id": "component-b--story-three",
              "initialArgs": Object {},
              "kind": "Component B",
              "name": "Story Three",
              "parameters": Object {
                "__id": "component-b--story-three",
                "__isArgsStory": false,
                "fileName": "file2",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Three",
              "subcomponents": undefined,
              "title": "Component B",
            },
            "component-c--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-one",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "Component C",
            },
            "component-c--story-two": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": undefined,
              "componentId": "component-c",
              "id": "component-c--story-two",
              "initialArgs": Object {},
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story Two",
              "subcomponents": undefined,
              "title": "Component C",
            },
          },
          "v": 2,
        }
      `);

      await waitForRender();
      expect(mockChannel.emit).toHaveBeenCalledWith(
        Events.STORY_RENDERED,
        'component-a--story-one'
      );

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'component-a--story-one',
        }),
        undefined
      );
    });
  });

  // These tests need to be in here, as they require a convoluted hookup between
  // a ClientApi and a StoryStore
  describe('ClientApi.getStorybook', () => {
    it('should transform the storybook to an array with filenames, empty', () => {
      const { configure, clientApi } = start(jest.fn());

      configure('test', () => {});
      expect(clientApi.getStorybook()).toEqual([]);
    });

    it('should transform the storybook to an array with filenames, full', () => {
      const { configure, clientApi } = start(jest.fn());

      configure('test', () => {
        clientApi
          .storiesOf('kind 1', { id: 'file1' } as any)
          .add('name 1', () => '1')
          .add('name 2', () => '2');

        clientApi
          .storiesOf('kind 2', { id: 'file2' } as any)
          .add('name 1', () => '1')
          .add('name 2', () => '2');
      });

      expect(clientApi.getStorybook()).toEqual([
        expect.objectContaining({
          fileName: expect.any(String),
          kind: 'kind 1',
          stories: [
            {
              name: 'name 1',
              render: expect.any(Function),
            },
            {
              name: 'name 2',
              render: expect.any(Function),
            },
          ],
        }),
        expect.objectContaining({
          fileName: expect.any(String),
          kind: 'kind 2',
          stories: [
            {
              name: 'name 1',
              render: expect.any(Function),
            },
            {
              name: 'name 2',
              render: expect.any(Function),
            },
          ],
        }),
      ]);
    });

    it('reads filename from module', async () => {
      const { configure, clientApi } = start(jest.fn());

      const fn = jest.fn();
      configure('test', () => {
        clientApi.storiesOf('kind', { id: 'foo.js' } as NodeModule).add('name', fn);
      });

      const storybook = clientApi.getStorybook();

      expect(storybook).toEqual([
        {
          kind: 'kind',
          fileName: 'foo.js',
          stories: [
            {
              name: 'name',
              render: expect.any(Function),
            },
          ],
        },
      ]);
    });

    it('should stringify ids from module', async () => {
      const { configure, clientApi } = start(jest.fn());

      const fn = jest.fn();
      configure('test', () => {
        clientApi.storiesOf('kind', { id: 1211 } as any).add('name', fn);
      });

      const storybook = clientApi.getStorybook();

      expect(storybook).toEqual([
        {
          kind: 'kind',
          fileName: '1211',
          stories: [
            {
              name: 'name',
              render: expect.any(Function),
            },
          ],
        },
      ]);
    });
  });

  describe('auto-title', () => {
    const componentDExports = {
      default: {
        component: 'Component D',
      },
      StoryOne: jest.fn(),
    };
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure } = start(render);
      configure('test', () => [componentDExports]);

      await waitForEvents([Events.SET_STORIES]);
      expect(
        mockChannel.emit.mock.calls.find((call: [string, any]) => call[0] === Events.SET_STORIES)[1]
      ).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "auto-title": Object {},
          },
          "stories": Object {
            "auto-title--story-one": Object {
              "argTypes": Object {},
              "args": Object {},
              "component": "Component D",
              "componentId": "auto-title",
              "id": "auto-title--story-one",
              "initialArgs": Object {},
              "kind": "auto-title",
              "name": "Story One",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "exports-map-0",
                "framework": "test",
              },
              "playFunction": undefined,
              "story": "Story One",
              "subcomponents": undefined,
              "title": "auto-title",
            },
          },
          "v": 2,
        }
      `);
    });
  });
});
