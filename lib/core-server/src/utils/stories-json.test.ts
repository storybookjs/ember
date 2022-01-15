import { Router, Request, Response } from 'express';
import Watchpack from 'watchpack';
import path from 'path';
import debounce from 'lodash/debounce';
import Events from '@storybook/core-events';

import { useStoriesJson, DEBOUNCE } from './stories-json';
import { ServerChannel } from './get-server-channel';

jest.mock('watchpack');
jest.mock('lodash/debounce');

const options: Parameters<typeof useStoriesJson>[2] = {
  configDir: path.join(__dirname, '__mockdata__'),
  presets: {
    apply: async () => ['./src/**/*.stories.(ts|js|jsx)'] as any,
  },
} as any;

describe('useStoriesJson', () => {
  const use = jest.fn();
  const router: Router = { use } as any;
  const send = jest.fn();
  const write = jest.fn();
  const response: Response = {
    header: jest.fn(),
    send,
    status: jest.fn(),
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write,
    flush: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  } as any;

  beforeEach(() => {
    use.mockClear();
    send.mockClear();
    write.mockClear();
    (debounce as jest.Mock).mockImplementation((cb) => cb);
  });

  const request: Request = {
    headers: { accept: 'application/json' },
  } as any;

  describe('JSON endpoint', () => {
    it('scans and extracts stories', async () => {
      const mockServerChannel = { emit: jest.fn() } as any as ServerChannel;
      await useStoriesJson(router, mockServerChannel, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      await route(request, response);

      expect(send).toHaveBeenCalledTimes(1);
      expect(JSON.parse(send.mock.calls[0][0])).toMatchInlineSnapshot(`
        Object {
          "stories": Object {
            "a--story-one": Object {
              "id": "a--story-one",
              "importPath": "./src/A.stories.js",
              "kind": "A",
              "name": "Story One",
              "parameters": Object {
                "__id": "a--story-one",
                "docsOnly": false,
                "fileName": "./src/A.stories.js",
              },
              "story": "Story One",
              "title": "A",
            },
            "b--story-one": Object {
              "id": "b--story-one",
              "importPath": "./src/B.stories.ts",
              "kind": "B",
              "name": "Story One",
              "parameters": Object {
                "__id": "b--story-one",
                "docsOnly": false,
                "fileName": "./src/B.stories.ts",
              },
              "story": "Story One",
              "title": "B",
            },
            "d--story-one": Object {
              "id": "d--story-one",
              "importPath": "./src/D.stories.jsx",
              "kind": "D",
              "name": "Story One",
              "parameters": Object {
                "__id": "d--story-one",
                "docsOnly": false,
                "fileName": "./src/D.stories.jsx",
              },
              "story": "Story One",
              "title": "D",
            },
            "first-nested-deeply-f--story-one": Object {
              "id": "first-nested-deeply-f--story-one",
              "importPath": "./src/first-nested/deeply/F.stories.js",
              "kind": "First Nested/Deeply/F",
              "name": "Story One",
              "parameters": Object {
                "__id": "first-nested-deeply-f--story-one",
                "docsOnly": false,
                "fileName": "./src/first-nested/deeply/F.stories.js",
              },
              "story": "Story One",
              "title": "First Nested/Deeply/F",
            },
            "nested-button--story-one": Object {
              "id": "nested-button--story-one",
              "importPath": "./src/nested/Button.stories.ts",
              "kind": "Nested/Button",
              "name": "Story One",
              "parameters": Object {
                "__id": "nested-button--story-one",
                "docsOnly": false,
                "fileName": "./src/nested/Button.stories.ts",
              },
              "story": "Story One",
              "title": "Nested/Button",
            },
            "second-nested-g--story-one": Object {
              "id": "second-nested-g--story-one",
              "importPath": "./src/second-nested/G.stories.ts",
              "kind": "Second Nested/G",
              "name": "Story One",
              "parameters": Object {
                "__id": "second-nested-g--story-one",
                "docsOnly": false,
                "fileName": "./src/second-nested/G.stories.ts",
              },
              "story": "Story One",
              "title": "Second Nested/G",
            },
          },
          "v": 3,
        }
      `);
    });
  });

  describe('SSE endpoint', () => {
    beforeEach(() => {
      use.mockClear();
      send.mockClear();
    });

    it('sends invalidate events', async () => {
      const mockServerChannel = { emit: jest.fn() } as any as ServerChannel;
      await useStoriesJson(router, mockServerChannel, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      await route(request, response);

      expect(write).not.toHaveBeenCalled();

      expect(Watchpack).toHaveBeenCalledTimes(1);
      const watcher = Watchpack.mock.instances[0];
      expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src'] });

      expect(watcher.on).toHaveBeenCalledTimes(2);
      const onChange = watcher.on.mock.calls[0][1];

      await onChange('src/nested/Button.stories.ts');
      expect(mockServerChannel.emit).toHaveBeenCalledTimes(1);
      expect(mockServerChannel.emit).toHaveBeenCalledWith(Events.STORY_INDEX_INVALIDATED);
    });

    it('only sends one invalidation when multiple event listeners are listening', async () => {
      const mockServerChannel = { emit: jest.fn() } as any as ServerChannel;
      await useStoriesJson(router, mockServerChannel, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      // Don't wait for the first request here before starting the second
      await Promise.all([
        route(request, response),
        route(request, { ...response, write: jest.fn() }),
      ]);

      expect(write).not.toHaveBeenCalled();

      expect(Watchpack).toHaveBeenCalledTimes(1);
      const watcher = Watchpack.mock.instances[0];
      expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src'] });

      expect(watcher.on).toHaveBeenCalledTimes(2);
      const onChange = watcher.on.mock.calls[0][1];

      await onChange('src/nested/Button.stories.ts');
      expect(mockServerChannel.emit).toHaveBeenCalledTimes(1);
      expect(mockServerChannel.emit).toHaveBeenCalledWith(Events.STORY_INDEX_INVALIDATED);
    });

    it('debounces invalidation events', async () => {
      (debounce as jest.Mock).mockImplementation(jest.requireActual('lodash/debounce'));

      const mockServerChannel = { emit: jest.fn() } as any as ServerChannel;
      await useStoriesJson(router, mockServerChannel, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      await route(request, response);

      expect(write).not.toHaveBeenCalled();

      expect(Watchpack).toHaveBeenCalledTimes(1);
      const watcher = Watchpack.mock.instances[0];
      expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src'] });

      expect(watcher.on).toHaveBeenCalledTimes(2);
      const onChange = watcher.on.mock.calls[0][1];

      await onChange('src/nested/Button.stories.ts');
      await onChange('src/nested/Button.stories.ts');
      await onChange('src/nested/Button.stories.ts');
      await onChange('src/nested/Button.stories.ts');
      await onChange('src/nested/Button.stories.ts');

      expect(mockServerChannel.emit).toHaveBeenCalledTimes(1);
      expect(mockServerChannel.emit).toHaveBeenCalledWith(Events.STORY_INDEX_INVALIDATED);

      await new Promise((r) => setTimeout(r, 2 * DEBOUNCE));

      expect(mockServerChannel.emit).toHaveBeenCalledTimes(2);
    });
  });
});
