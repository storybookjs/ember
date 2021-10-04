import { Router, Request, Response } from 'express';
import Watchpack from 'watchpack';
import path from 'path';

import { useStoriesJson } from './stories-json';

// Avoid ping events
jest.useFakeTimers();

jest.mock('watchpack');

const options: Parameters<typeof useStoriesJson>[1] = {
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
  });

  describe('JSON endpoint', () => {
    const request: Request = {
      headers: { accept: 'application/json' },
    } as any;

    it('scans and extracts stories', async () => {
      await useStoriesJson(router, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      await route(request, response);

      expect(send).toHaveBeenCalledTimes(1);
      expect(JSON.parse(send.mock.calls[0][0])).toMatchInlineSnapshot(`
        Object {
          "stories": Object {
            "a--story-one": Object {
              "importPath": "./src/A.stories.js",
              "name": "Story One",
              "title": "A",
            },
            "b--story-one": Object {
              "importPath": "./src/B.stories.ts",
              "name": "Story One",
              "title": "B",
            },
            "d--story-one": Object {
              "importPath": "./src/D.stories.jsx",
              "name": "Story One",
              "title": "D",
            },
            "nested-button--story-one": Object {
              "importPath": "./src/nested/Button.stories.ts",
              "name": "Story One",
              "title": "Nested/Button",
            },
            "second-nested-f--story-one": Object {
              "importPath": "./src/second-nested/F.stories.ts",
              "name": "Story One",
              "title": "Second Nested/F",
            },
          },
          "v": 3,
        }
      `);
    });
  });

  describe('SSE endpoint', () => {
    const request: Request = {
      headers: { accept: 'text/event-stream' },
    } as any;

    beforeEach(() => {
      use.mockClear();
      send.mockClear();
    });

    it('sends invalidate events', async () => {
      await useStoriesJson(router, options, options.configDir);

      expect(use).toHaveBeenCalledTimes(1);
      const route = use.mock.calls[0][1];

      await route(request, response);

      expect(write).not.toHaveBeenCalled();

      expect(Watchpack).toHaveBeenCalledTimes(1);
      const watcher = Watchpack.mock.instances[0];
      expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src'] });

      expect(watcher.on).toHaveBeenCalledTimes(2);
      const onChange = watcher.on.mock.calls[0][1];

      onChange('src/nested/Button.stories.ts');
      expect(write).toHaveBeenCalledWith('event:INVALIDATE\ndata:\n\n');
    });
  });
});
