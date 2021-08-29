import global from 'global';
import { EventEmitter } from 'events';
import Events from '@storybook/core-events';

import { start } from './start';
import {
  emitter,
  mockChannel,
  waitForEvents,
  waitForRender,
  waitForQuiescence,
} from '../../../web-preview/src/WebPreview.mockdata';

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
    // TODO -- move start into web-preview so we can mock web-view?
    getElementById: jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
    }),
    body: {
      classList: {
        remove: jest.fn(),
        add: jest.fn(),
      },
    },
    documentElement: {},
  },
}));

jest.mock('@storybook/channel-postmessage', () => () => mockChannel);

describe('start', () => {
  describe('when configure is called with storiesOf only', () => {
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi
          .storiesOf('Component A', { id: 'file1' })
          .add('Story One', jest.fn())
          .add('Story Two', jest.fn());

        clientApi.storiesOf('Component B', { id: 'file2' }).add('Story Three', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_STORIES, expect.any(Object));
      expect(mockChannel.emit.mock.calls.find((c) => c[0] === Events.SET_STORIES)[1])
        .toMatchInlineSnapshot(`
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
        expect.any(Object)
      );
    });

    it('deals with stories with "default" name', async () => {
      const render = jest.fn();

      const { configure, clientApi } = start(render);

      configure('test', () => {
        clientApi.storiesOf('Component A', { id: 'file1' }).add('default', jest.fn());
      });

      await waitForRender();

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.STORY_RENDERED, 'component-a--default');
    });
  });

  const componentThreeExports = {
    default: {
      title: 'Component Three',
    },
    StoryOne: jest.fn(),
    StoryTwo: jest.fn(),
  };

  describe('when configure is called with CSF only', () => {
    it('loads and renders the first story correctly', async () => {
      const render = jest.fn();

      const { configure } = start(render);
      configure('test', () => [componentThreeExports]);

      await waitForRender();
      console.dir(mockChannel.emit.mock.calls, { depth: 4 });

      expect(mockChannel.emit).toHaveBeenCalledWith(Events.SET_STORIES, expect.any(Object));
      expect(mockChannel.emit.mock.calls.find((c) => c[0] === Events.SET_STORIES)[1])
        .toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {},
          "kindParameters": Object {
            "Component Three": Object {},
          },
          "stories": Object {
            "component-three--story-one": Object {
              "id": "component-three--story-one",
              "kind": "Component Three",
              "name": "Story One",
              "parameters": Object {
                "fileName": "exports-map-0",
              },
            },
            "component-three--story-two": Object {
              "id": "component-three--story-two",
              "kind": "Component Three",
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
        'component-three--story-one'
      );

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'component-three--story-one',
        }),
        expect.any(Object)
      );
    });
  });

  describe('when configure is called with a combination', () => {});
});
