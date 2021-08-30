import global from 'global';
import { EventEmitter } from 'events';
import Events from '@storybook/core-events';

import {
  waitForRender,
  waitForEvents,
  mockChannel,
} from '@storybook/web-preview/dist/cjs/WebPreview.mockdata';

import { start } from './start';

jest.mock('@storybook/web-preview/dist/cjs/WebView');

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

jest.mock('@storybook/channel-postmessage', () => () => mockChannel);

beforeEach(() => {
  // mockChannel.emit.mockClear();
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
              "id": "component-a--story-one",
              "kind": "Component A",
              "name": "Story One",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-a--story-two": Object {
              "id": "component-a--story-two",
              "kind": "Component A",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-b--story-three": Object {
              "id": "component-b--story-three",
              "kind": "Component B",
              "name": "Story Three",
              "parameters": Object {
                "fileName": "file2",
              },
            },
          },
          "v": 3,
        }
      `);

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

    it('deals with stories with "default" name', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' } as NodeModule).add('default', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
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
              "id": "component-a--default",
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-a--new": Object {
              "id": "component-a--new",
              "kind": "Component A",
              "name": "new",
              "parameters": Object {
                "fileName": "file1",
              },
            },
          },
          "v": 3,
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
              "id": "component-a--default",
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-b--default": Object {
              "id": "component-b--default",
              "kind": "Component B",
              "name": "default",
              "parameters": Object {
                "fileName": "file2",
              },
            },
          },
          "v": 3,
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
              "id": "component-a--default",
              "kind": "Component A",
              "name": "default",
              "parameters": Object {
                "fileName": "file1",
              },
            },
          },
          "v": 3,
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
              "id": "component-c--story-one",
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-two": Object {
              "id": "component-c--story-two",
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
          },
          "v": 3,
        }
      `);

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
              "id": "component-c--story-one",
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-three": Object {
              "id": "component-c--story-three",
              "kind": "Component C",
              "name": "Story Three",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-two": Object {
              "id": "component-c--story-two",
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
          },
          "v": 3,
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
              "id": "component-c--story-one",
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-two": Object {
              "id": "component-c--story-two",
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-d--story-four": Object {
              "id": "component-d--story-four",
              "kind": "Component D",
              "name": "Story Four",
              "parameters": Object {
                "fileName": "exports-map-1",
              },
            },
          },
          "v": 3,
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
              "id": "component-c--story-one",
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-two": Object {
              "id": "component-c--story-two",
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
          },
          "v": 3,
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
              "id": "component-a--story-one",
              "kind": "Component A",
              "name": "Story One",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-a--story-two": Object {
              "id": "component-a--story-two",
              "kind": "Component A",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "file1",
              },
            },
            "component-b--story-three": Object {
              "id": "component-b--story-three",
              "kind": "Component B",
              "name": "Story Three",
              "parameters": Object {
                "fileName": "file2",
              },
            },
            "component-c--story-one": Object {
              "id": "component-c--story-one",
              "kind": "Component C",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-c--story-two": Object {
              "id": "component-c--story-two",
              "kind": "Component C",
              "name": "Story Two",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
          },
          "v": 3,
        }
      `);

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
});
