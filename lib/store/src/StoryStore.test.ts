import { StoryId } from '@storybook/api';
import { AnyFramework, ProjectAnnotations } from '@storybook/csf';
import { HooksContext } from '../../addons/dist/ts3.9/hooks';

import { prepareStory } from './prepareStory';
import { processCSFFile } from './processCSFFile';
import { StoryStore } from './StoryStore';
import { StoryIndex } from './types';

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
const fetchStoryIndex = async () => storyIndex;

describe('StoryStore', () => {
  describe('projectAnnotations', () => {
    it('normalizes on initialization', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      expect(store.projectAnnotations.globalTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
      expect(store.projectAnnotations.argTypes).toEqual({
        a: { name: 'a', type: { name: 'string' } },
      });
    });

    it('normalizes on updateGlobalAnnotations', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      store.updateProjectAnnotations(projectAnnotations);
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
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

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
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

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
  });

  describe('componentStoriesFromCSFFile', () => {
    it('returns all the stories in the file', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      const csfFile = await store.loadCSFFileByStoryId('component-one--a', { sync: false });
      const stories = store.componentStoriesFromCSFFile({ csfFile });

      expect(stories).toHaveLength(2);
      expect(stories.map((s) => s.id)).toEqual(['component-one--a', 'component-one--b']);
    });
  });

  describe('getStoryContext', () => {
    it('returns the args and globals correctly', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      expect(store.getStoryContext(story)).toMatchObject({
        args: { foo: 'a' },
        globals: { a: 'b' },
      });
    });

    it('returns the args and globals correctly when they change', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      store.args.update(story.id, { foo: 'bar' });
      store.globals.update({ a: 'c' });

      expect(store.getStoryContext(story)).toMatchObject({
        args: { foo: 'bar' },
        globals: { a: 'c' },
      });
    });

    it('returns the same hooks each time', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

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
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      const story = await store.loadStory({ storyId: 'component-one--a' });

      const { hooks } = store.getStoryContext(story) as { hooks: HooksContext<AnyFramework> };
      hooks.clean = jest.fn();
      store.cleanupStory(story);
      expect(hooks.clean).toHaveBeenCalled();
    });
  });

  describe('loadAllCSFFiles', () => {
    it('imports *all* csf files', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      importFn.mockClear();
      const csfFiles = await store.loadAllCSFFiles(false);

      expect(Object.keys(csfFiles)).toEqual([
        './src/ComponentOne.stories.js',
        './src/ComponentTwo.stories.js',
      ]);
    });
  });

  describe('extract', () => {
    it('throws if you have not called cacheAllCSFFiles', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });

      expect(() => store.extract()).toThrow(/Cannot call extract/);
    });

    it('produces objects with functions and hooks stripped', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });
      await store.cacheAllCSFFiles(false);

      expect(store.extract()).toMatchInlineSnapshot(`
        Array [
          Object {
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
            },
            "story": "A",
            "subcomponents": undefined,
            "title": "Component One",
          },
          Object {
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
            },
            "story": "B",
            "subcomponents": undefined,
            "title": "Component One",
          },
          Object {
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
            },
            "story": "C",
            "subcomponents": undefined,
            "title": "Component Two",
          },
        ]
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
      const store = new StoryStore({
        importFn: docsOnlyImportFn,
        fetchStoryIndex,
      });
      await store.initialize({ projectAnnotations, sync: false });
      await store.cacheAllCSFFiles(false);

      expect((store.extract() as { id: StoryId }[]).map((s) => s.id)).toEqual([
        'component-one--b',
        'component-two--c',
      ]);

      expect(
        (store.extract({ includeDocsOnly: true }) as { id: StoryId }[]).map((s) => s.id)
      ).toEqual(['component-one--a', 'component-one--b', 'component-two--c']);
    });
  });

  describe('getSetStoriesPayload', () => {
    it('maps stories list to payload correctly', async () => {
      const store = new StoryStore({ importFn, fetchStoryIndex });
      await store.initialize({ projectAnnotations, sync: false });
      await store.cacheAllCSFFiles(false);

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
          "stories": Array [
            Object {
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
              },
              "story": "A",
              "subcomponents": undefined,
              "title": "Component One",
            },
            Object {
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
              },
              "story": "B",
              "subcomponents": undefined,
              "title": "Component One",
            },
            Object {
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
              },
              "story": "C",
              "subcomponents": undefined,
              "title": "Component Two",
            },
          ],
          "v": 2,
        }
      `);
    });
  });
});
