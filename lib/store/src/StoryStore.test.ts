import { AnyFramework, ProjectAnnotations } from '@storybook/csf';
import global from 'global';

import { prepareStory } from './prepareStory';
import { processCSFFile } from './processCSFFile';
import { StoryStore } from './StoryStore';
import { StoryIndex } from './types';
import { HooksContext } from './hooks';

// Spy on prepareStory/processCSFFile
jest.mock('./prepareStory', () => ({
  prepareStory: jest.fn(jest.requireActual('./prepareStory').prepareStory),
}));
jest.mock('./processCSFFile', () => ({
  processCSFFile: jest.fn(jest.requireActual('./processCSFFile').processCSFFile),
}));

jest.mock('global', () => ({
  ...(jest.requireActual('global') as any),
  FEATURES: {
    breakingChangesV7: true,
  },
}));

const componentOneExports = {
  default: { title: 'Component One' },
  a: { args: { foo: 'a' } },
  b: { args: { foo: 'b' } },
};
const componentTwoExports = {
  default: { title: 'Component Two' },
  c: { args: { foo: 'c' } },
};
const importFn = jest.fn(async (path) => {
  return path === './src/ComponentOne.stories.js' ? componentOneExports : componentTwoExports;
});

const projectAnnotations: ProjectAnnotations<any> = {
  globals: { a: 'b' },
  globalTypes: { a: { type: 'string' } },
  argTypes: { a: { type: 'string' } },
  render: jest.fn(),
};

const storyIndex: StoryIndex = {
  v: 3,
  stories: {
    'component-one--a': {
      id: 'component-one--a',
      title: 'Component One',
      name: 'A',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-one--b': {
      id: 'component-one--b',
      title: 'Component One',
      name: 'B',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-two--c': {
      id: 'component-two--c',
      title: 'Component Two',
      name: 'C',
      importPath: './src/ComponentTwo.stories.js',
    },
  },
};

describe('StoryStore', () => {
  describe('projectAnnotations', () => {
    it('normalizes on initialization', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      expect(store.projectAnnotations.globalTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
      expect(store.projectAnnotations.argTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
    });

    it('normalizes on updateGlobalAnnotations', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      store.setProjectAnnotations(projectAnnotations);
      expect(store.projectAnnotations.globalTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
      expect(store.projectAnnotations.argTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
    });
  });

  describe('loadStory', () => {
    it('pulls the story via the importFn', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      importFn.mockClear();
      expect(await store.loadStory({ storyId: 'component-one--a' })).toMatchObject({
        id: 'component-one--a',
        name: 'A',
        title: 'Component One',
        initialArgs: { foo: 'a' },
      });
      expect(importFn).toHaveBeenCalledWith('./src/ComponentOne.stories.js');
    });

    it('uses a cache', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      // We are intentionally checking exact equality here, we need the object to be identical
      expect(await store.loadStory({ storyId: 'component-one--a' })).toBe(story);
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      await store.loadStory({ storyId: 'component-one--b' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(2);

      await store.loadStory({ storyId: 'component-two--c' });
      expect(processCSFFile).toHaveBeenCalledTimes(2);
      expect(prepareStory).toHaveBeenCalledTimes(3);
    });

    describe('if the store is not yet initialized', () => {
      it('waits for initialization', async () => {
        const store = new StoryStore();

        importFn.mockClear();
        const loadPromise = store.loadStory({ storyId: 'component-one--a' });

        store.setProjectAnnotations(projectAnnotations);
        store.initialize({ storyIndex, importFn, cache: false });

        expect(await loadPromise).toMatchObject({
          id: 'component-one--a',
          name: 'A',
          title: 'Component One',
          initialArgs: { foo: 'a' },
        });
        expect(importFn).toHaveBeenCalledWith('./src/ComponentOne.stories.js');
      });
    });
  });

  describe('setProjectAnnotations', () => {
    it('busts the loadStory cache', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      store.setProjectAnnotations({ ...projectAnnotations, decorators: [jest.fn()] });

      // We are intentionally checking exact equality here, we need the object to be identical
      expect(await store.loadStory({ storyId: 'component-one--a' })).not.toBe(story);
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(2);
    });
  });

  describe('onStoriesChanged', () => {
    it('busts the loadStory cache if the importFn returns a new module', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      await store.onStoriesChanged({
        importFn: async () => ({
          ...componentOneExports,
          c: { args: { foo: 'c' } },
        }),
      });

      // The object is not identical which will cause it to be treated as a new story
      expect(await store.loadStory({ storyId: 'component-one--a' })).not.toBe(story);
      expect(processCSFFile).toHaveBeenCalledTimes(2);
      expect(prepareStory).toHaveBeenCalledTimes(2);
    });

    it('busts the loadStory cache if the csf file no longer appears in the index', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      // The stories are no longer in the index
      await store.onStoriesChanged({ storyIndex: { v: 3, stories: {} } });

      await expect(store.loadStory({ storyId: 'component-one--a' })).rejects.toThrow();

      // We don't load or process any CSF
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);
    });

    it('reuses the cache if a story importPath has not changed', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);

      // Add a new story to the index that isn't different
      await store.onStoriesChanged({
        storyIndex: {
          v: 3,
          stories: {
            ...storyIndex.stories,
            'new-component--story': {
              id: 'new-component--story',
              title: 'New Component',
              name: 'Story',
              importPath: './new-component.stories.js',
            },
          },
        },
      });

      // We are intentionally checking exact equality here, we need the object to be identical
      expect(await store.loadStory({ storyId: 'component-one--a' })).toEqual(story);
      expect(processCSFFile).toHaveBeenCalledTimes(1);
      expect(prepareStory).toHaveBeenCalledTimes(1);
    });

    it('imports with a new path for a story id if provided', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      await store.loadStory({ storyId: 'component-one--a' });
      expect(importFn).toHaveBeenCalledWith(storyIndex.stories['component-one--a'].importPath);

      const newImportPath = './src/ComponentOne-new.stories.js';
      const newImportFn = jest.fn(async () => componentOneExports);
      await store.onStoriesChanged({
        importFn: newImportFn,
        storyIndex: {
          v: 3,
          stories: {
            'component-one--a': {
              id: 'component-one--a',
              title: 'Component One',
              name: 'A',
              importPath: newImportPath,
            },
          },
        },
      });

      await store.loadStory({ storyId: 'component-one--a' });
      expect(newImportFn).toHaveBeenCalledWith(newImportPath);
    });

    it('re-caches stories if the were cached already', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });
      await store.cacheAllCSFFiles();

      await store.loadStory({ storyId: 'component-one--a' });
      expect(importFn).toHaveBeenCalledWith(storyIndex.stories['component-one--a'].importPath);

      const newImportPath = './src/ComponentOne-new.stories.js';
      const newImportFn = jest.fn(async () => componentOneExports);
      await store.onStoriesChanged({
        importFn: newImportFn,
        storyIndex: {
          v: 3,
          stories: {
            'component-one--a': {
              id: 'component-one--a',
              title: 'Component One',
              name: 'A',
              importPath: newImportPath,
            },
          },
        },
      });

      expect(store.extract()).toMatchInlineSnapshot(`
        Object {
          "component-one--a": Object {
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "foo": "a",
            },
            "component": undefined,
            "componentId": "component-one",
            "id": "component-one--a",
            "initialArgs": Object {
              "foo": "a",
            },
            "kind": "Component One",
            "name": "A",
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentOne-new.stories.js",
            },
            "playFunction": undefined,
            "story": "A",
            "subcomponents": undefined,
            "title": "Component One",
          },
        }
      `);
    });
  });

  describe('componentStoriesFromCSFFile', () => {
    it('returns all the stories in the file', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const csfFile = await store.loadCSFFileByStoryId('component-one--a');
      const stories = store.componentStoriesFromCSFFile({ csfFile });

      expect(stories).toHaveLength(2);
      expect(stories.map((s) => s.id)).toEqual(['component-one--a', 'component-one--b']);
    });
  });

  describe('getStoryContext', () => {
    it('returns the args and globals correctly', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      expect(store.getStoryContext(story)).toMatchObject({
        args: { foo: 'a' },
        globals: { a: 'b' },
      });
    });

    it('returns the args and globals correctly when they change', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      store.args.update(story.id, { foo: 'bar' });
      store.globals.update({ a: 'c' });

      expect(store.getStoryContext(story)).toMatchObject({
        args: { foo: 'bar' },
        globals: { a: 'c' },
      });
    });

    it('returns the same hooks each time', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      const { hooks } = store.getStoryContext(story);
      expect(store.getStoryContext(story).hooks).toBe(hooks);

      // Now double check it doesn't get changed when you call `loadStory` again
      const story2 = await store.loadStory({ storyId: 'component-one--a' });
      expect(store.getStoryContext(story2).hooks).toBe(hooks);
    });
  });

  describe('cleanupStory', () => {
    it('cleans the hooks from the context', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      const { hooks } = store.getStoryContext(story) as { hooks: HooksContext<AnyFramework> };
      hooks.clean = jest.fn();
      store.cleanupStory(story);
      expect(hooks.clean).toHaveBeenCalled();
    });
  });

  describe('loadAllCSFFiles', () => {
    it('imports *all* csf files', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      importFn.mockClear();
      const csfFiles = await store.loadAllCSFFiles();

      expect(Object.keys(csfFiles)).toEqual([
        './src/ComponentOne.stories.js',
        './src/ComponentTwo.stories.js',
      ]);
    });
  });

  describe('extract', () => {
    it('throws if you have not called cacheAllCSFFiles', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });

      expect(() => store.extract()).toThrow(/Cannot call extract/);
    });

    it('produces objects with functions and hooks stripped', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });
      await store.cacheAllCSFFiles();

      expect(store.extract()).toMatchInlineSnapshot(`
        Object {
          "component-one--a": Object {
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "foo": "a",
            },
            "component": undefined,
            "componentId": "component-one",
            "id": "component-one--a",
            "initialArgs": Object {
              "foo": "a",
            },
            "kind": "Component One",
            "name": "A",
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentOne.stories.js",
            },
            "playFunction": undefined,
            "story": "A",
            "subcomponents": undefined,
            "title": "Component One",
          },
          "component-one--b": Object {
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "foo": "b",
            },
            "component": undefined,
            "componentId": "component-one",
            "id": "component-one--b",
            "initialArgs": Object {
              "foo": "b",
            },
            "kind": "Component One",
            "name": "B",
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentOne.stories.js",
            },
            "playFunction": undefined,
            "story": "B",
            "subcomponents": undefined,
            "title": "Component One",
          },
          "component-two--c": Object {
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "foo": "c",
            },
            "component": undefined,
            "componentId": "component-two",
            "id": "component-two--c",
            "initialArgs": Object {
              "foo": "c",
            },
            "kind": "Component Two",
            "name": "C",
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentTwo.stories.js",
            },
            "playFunction": undefined,
            "story": "C",
            "subcomponents": undefined,
            "title": "Component Two",
          },
        }
      `);
    });

    it('does not include docs only stories by default', async () => {
      const docsOnlyImportFn = jest.fn(async (path) => {
        return path === './src/ComponentOne.stories.js'
          ? {
              ...componentOneExports,
              a: { ...componentOneExports.a, parameters: { docsOnly: true } },
            }
          : componentTwoExports;
      });
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({
        storyIndex,
        importFn: docsOnlyImportFn,
        cache: false,
      });
      await store.cacheAllCSFFiles();

      expect(Object.keys(store.extract())).toEqual(['component-one--b', 'component-two--c']);

      expect(Object.keys(store.extract({ includeDocsOnly: true }))).toEqual([
        'component-one--a',
        'component-one--b',
        'component-two--c',
      ]);
    });
  });

  describe('raw', () => {
    it('produces an array of stories', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });
      await store.cacheAllCSFFiles();

      expect(store.raw()).toMatchInlineSnapshot(`
        Array [
          Object {
            "applyLoaders": [Function],
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "component": undefined,
            "componentId": "component-one",
            "id": "component-one--a",
            "initialArgs": Object {
              "foo": "a",
            },
            "kind": "Component One",
            "name": "A",
            "originalStoryFn": [MockFunction],
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentOne.stories.js",
            },
            "playFunction": undefined,
            "story": "A",
            "storyFn": [Function],
            "subcomponents": undefined,
            "title": "Component One",
            "unboundStoryFn": [Function],
            "undecoratedStoryFn": [Function],
          },
          Object {
            "applyLoaders": [Function],
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "component": undefined,
            "componentId": "component-one",
            "id": "component-one--b",
            "initialArgs": Object {
              "foo": "b",
            },
            "kind": "Component One",
            "name": "B",
            "originalStoryFn": [MockFunction],
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentOne.stories.js",
            },
            "playFunction": undefined,
            "story": "B",
            "storyFn": [Function],
            "subcomponents": undefined,
            "title": "Component One",
            "unboundStoryFn": [Function],
            "undecoratedStoryFn": [Function],
          },
          Object {
            "applyLoaders": [Function],
            "argTypes": Object {
              "a": Object {
                "name": "a",
                "type": Object {
                  "name": "string",
                },
              },
              "foo": Object {
                "name": "foo",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "component": undefined,
            "componentId": "component-two",
            "id": "component-two--c",
            "initialArgs": Object {
              "foo": "c",
            },
            "kind": "Component Two",
            "name": "C",
            "originalStoryFn": [MockFunction],
            "parameters": Object {
              "__isArgsStory": false,
              "fileName": "./src/ComponentTwo.stories.js",
            },
            "playFunction": undefined,
            "story": "C",
            "storyFn": [Function],
            "subcomponents": undefined,
            "title": "Component Two",
            "unboundStoryFn": [Function],
            "undecoratedStoryFn": [Function],
          },
        ]
      `);
    });
  });

  describe('getSetStoriesPayload', () => {
    it('maps stories list to payload correctly', async () => {
      const store = new StoryStore();
      store.setProjectAnnotations(projectAnnotations);
      store.initialize({ storyIndex, importFn, cache: false });
      await store.cacheAllCSFFiles();

      expect(store.getSetStoriesPayload()).toMatchInlineSnapshot(`
        Object {
          "globalParameters": Object {},
          "globals": Object {
            "a": "b",
          },
          "kindParameters": Object {
            "Component One": Object {},
            "Component Two": Object {},
          },
          "stories": Object {
            "component-one--a": Object {
              "argTypes": Object {
                "a": Object {
                  "name": "a",
                  "type": Object {
                    "name": "string",
                  },
                },
                "foo": Object {
                  "name": "foo",
                  "type": Object {
                    "name": "string",
                  },
                },
              },
              "args": Object {
                "foo": "a",
              },
              "component": undefined,
              "componentId": "component-one",
              "id": "component-one--a",
              "initialArgs": Object {
                "foo": "a",
              },
              "kind": "Component One",
              "name": "A",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "./src/ComponentOne.stories.js",
              },
              "playFunction": undefined,
              "story": "A",
              "subcomponents": undefined,
              "title": "Component One",
            },
            "component-one--b": Object {
              "argTypes": Object {
                "a": Object {
                  "name": "a",
                  "type": Object {
                    "name": "string",
                  },
                },
                "foo": Object {
                  "name": "foo",
                  "type": Object {
                    "name": "string",
                  },
                },
              },
              "args": Object {
                "foo": "b",
              },
              "component": undefined,
              "componentId": "component-one",
              "id": "component-one--b",
              "initialArgs": Object {
                "foo": "b",
              },
              "kind": "Component One",
              "name": "B",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "./src/ComponentOne.stories.js",
              },
              "playFunction": undefined,
              "story": "B",
              "subcomponents": undefined,
              "title": "Component One",
            },
            "component-two--c": Object {
              "argTypes": Object {
                "a": Object {
                  "name": "a",
                  "type": Object {
                    "name": "string",
                  },
                },
                "foo": Object {
                  "name": "foo",
                  "type": Object {
                    "name": "string",
                  },
                },
              },
              "args": Object {
                "foo": "c",
              },
              "component": undefined,
              "componentId": "component-two",
              "id": "component-two--c",
              "initialArgs": Object {
                "foo": "c",
              },
              "kind": "Component Two",
              "name": "C",
              "parameters": Object {
                "__isArgsStory": false,
                "fileName": "./src/ComponentTwo.stories.js",
              },
              "playFunction": undefined,
              "story": "C",
              "subcomponents": undefined,
              "title": "Component Two",
            },
          },
          "v": 2,
        }
      `);
    });
  });

  describe('getStoriesJsonData', () => {
    describe('in back-compat mode', () => {
      beforeEach(() => {
        global.FEATURES.breakingChangesV7 = false;
      });
      afterEach(() => {
        global.FEATURES.breakingChangesV7 = true;
      });
      it('maps stories list to payload correctly', async () => {
        const store = new StoryStore();
        store.setProjectAnnotations(projectAnnotations);
        store.initialize({ storyIndex, importFn, cache: false });
        await store.cacheAllCSFFiles();

        expect(store.getStoriesJsonData()).toMatchInlineSnapshot(`
          Object {
            "stories": Object {
              "component-one--a": Object {
                "id": "component-one--a",
                "importPath": "./src/ComponentOne.stories.js",
                "kind": "Component One",
                "name": "A",
                "parameters": Object {
                  "__id": "component-one--a",
                  "__isArgsStory": false,
                  "fileName": "./src/ComponentOne.stories.js",
                },
                "story": "A",
                "title": "Component One",
              },
              "component-one--b": Object {
                "id": "component-one--b",
                "importPath": "./src/ComponentOne.stories.js",
                "kind": "Component One",
                "name": "B",
                "parameters": Object {
                  "__id": "component-one--b",
                  "__isArgsStory": false,
                  "fileName": "./src/ComponentOne.stories.js",
                },
                "story": "B",
                "title": "Component One",
              },
              "component-two--c": Object {
                "id": "component-two--c",
                "importPath": "./src/ComponentTwo.stories.js",
                "kind": "Component Two",
                "name": "C",
                "parameters": Object {
                  "__id": "component-two--c",
                  "__isArgsStory": false,
                  "fileName": "./src/ComponentTwo.stories.js",
                },
                "story": "C",
                "title": "Component Two",
              },
            },
            "v": 3,
          }
        `);
      });
    });

    describe('in non-back-compat mode', () => {
      it('maps stories list to payload correctly', async () => {
        const store = new StoryStore();
        store.setProjectAnnotations(projectAnnotations);
        store.initialize({ storyIndex, importFn, cache: false });
        await store.cacheAllCSFFiles();

        expect(store.getStoriesJsonData()).toMatchInlineSnapshot(`
          Object {
            "stories": Object {
              "component-one--a": Object {
                "id": "component-one--a",
                "importPath": "./src/ComponentOne.stories.js",
                "name": "A",
                "title": "Component One",
              },
              "component-one--b": Object {
                "id": "component-one--b",
                "importPath": "./src/ComponentOne.stories.js",
                "name": "B",
                "title": "Component One",
              },
              "component-two--c": Object {
                "id": "component-two--c",
                "importPath": "./src/ComponentTwo.stories.js",
                "name": "C",
                "title": "Component Two",
              },
            },
            "v": 3,
          }
        `);
      });
    });
  });

  describe('cacheAllCsfFiles', () => {
    describe('if the store is not yet initialized', () => {
      it('waits for initialization', async () => {
        const store = new StoryStore();

        importFn.mockClear();
        const cachePromise = store.cacheAllCSFFiles();

        store.setProjectAnnotations(projectAnnotations);
        store.initialize({ storyIndex, importFn, cache: false });

        await expect(cachePromise).resolves.toEqual(undefined);
      });
    });
  });
});
