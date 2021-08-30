import global from 'global';
import { EventEmitter } from 'events';
import Events from '@storybook/core-events';

import {
  waitForRender,
  emitter,
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

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_STORIES, expect.any(Object));
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

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_STORIES, expect.any(Object));
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

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_STORIES, expect.any(Object));
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
