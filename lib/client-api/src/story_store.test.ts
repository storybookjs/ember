/* eslint-disable no-underscore-dangle */
import createChannel from '@storybook/channel-postmessage';
import { toId } from '@storybook/csf';
import { addons, mockChannel } from '@storybook/addons';
import Events from '@storybook/core-events';

import StoryStore from './story_store';
import { defaultDecorateStory } from './decorators';

jest.mock('@storybook/node-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

let channel;
beforeEach(() => {
  channel = createChannel({ page: 'preview' });
});

function addReverseSorting(store) {
  store.addGlobalMetadata({
    decorators: [],
    parameters: {
      options: {
        // Test function does reverse alphabetical ordering.
        storySort: (a: any, b: any): number =>
          a[1].kind === b[1].kind
            ? 0
            : -1 * a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
      },
    },
  });
}

// make a story and add it to the store
const addStoryToStore = (store, kind, name, storyFn, parameters = {}) =>
  store.addStory(
    {
      kind,
      name,
      storyFn,
      parameters,
      id: toId(kind, name),
    },
    {
      // FIXME: need applyHooks, but this breaks the current tests
      applyDecorators: defaultDecorateStory,
    }
  );

describe('preview.story_store', () => {
  describe('extract', () => {
    it('produces stories objects with inherited (denormalized) metadata', () => {
      const store = new StoryStore({ channel });

      store.addGlobalMetadata({ parameters: { global: 'global' }, decorators: [] });

      store.addKindMetadata('a', { parameters: { kind: 'kind' }, decorators: [] });

      addStoryToStore(store, 'a', '1', () => 0, { story: 'story' });
      addStoryToStore(store, 'a', '2', () => 0);
      addStoryToStore(store, 'b', '1', () => 0);

      const extracted = store.extract();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(extracted)).toEqual(['a--1', 'a--2', 'b--1']);

      // content of item should be correct
      expect(extracted['a--1']).toMatchObject({
        id: 'a--1',
        kind: 'a',
        name: '1',
        parameters: { global: 'global', kind: 'kind', story: 'story' },
      });
    });
  });

  describe('args', () => {
    it('automatically infers argTypes based on args', () => {
      const store = new StoryStore({ channel });
      store.startConfiguring();
      addStoryToStore(store, 'a', '1', () => 0, {
        args: {
          arg1: 3,
          arg2: 'foo',
          arg3: false,
        },
      });
      expect(store.getRawStory('a', '1').argTypes).toEqual({
        arg1: { name: 'arg1', type: { name: 'number' } },
        arg2: { name: 'arg2', type: { name: 'string' } },
        arg3: { name: 'arg3', type: { name: 'boolean' } },
      });
    });
  });

  describe('argTypesEnhancer', () => {
    it('automatically infers argTypes from args', () => {
      const store = new StoryStore({ channel });
      store.startConfiguring();
      addStoryToStore(store, 'a', '1', () => 0, { args: { a: null, b: 'hello', c: 9 } });
      expect(store.getRawStory('a', '1').parameters.argTypes).toMatchInlineSnapshot(`
        Object {
          "a": Object {
            "name": "a",
            "type": Object {
              "name": "object",
              "value": Object {},
            },
          },
          "b": Object {
            "name": "b",
            "type": Object {
              "name": "string",
            },
          },
          "c": Object {
            "name": "c",
            "type": Object {
              "name": "number",
            },
          },
        }
      `);
    });

    it('adds user and default enhancers', () => {
      const store = new StoryStore({ channel });
      expect(store._argTypesEnhancers.length).toBe(1);

      const enhancer = () => ({});
      store.addArgTypesEnhancer(enhancer);
      expect(store._argTypesEnhancers.length).toBe(2);

      store.startConfiguring();
      expect(store._argTypesEnhancers.length).toBe(4);

      addStoryToStore(store, 'a', '1', () => 0);
      addStoryToStore(store, 'a', '2', () => 0);
      store.finishConfiguring();
      expect(store._argTypesEnhancers.length).toBe(4);
    });
  });

  describe('HMR behaviour', () => {
    it('tries again with a specifier if it failed the first time', () => {
      const store = new StoryStore({ channel });
      store.setSelectionSpecifier({ storySpecifier: 'a--2', viewMode: 'story' });
      addStoryToStore(store, 'a', '1', () => 0);
      store.finishConfiguring();

      expect(store.getSelection()).toEqual(undefined);

      store.startConfiguring();
      store.removeStoryKind('a');
      addStoryToStore(store, 'a', '1', () => 0);
      addStoryToStore(store, 'a', '2', () => 0);
      store.finishConfiguring();

      expect(store.getSelection()).toEqual({ storyId: 'a--2', viewMode: 'story' });
    });

    it('DOES NOT try again if the selection changed in the meantime', () => {
      const store = new StoryStore({ channel });
      store.setSelectionSpecifier({ storySpecifier: 'a--2', viewMode: 'story' });
      addStoryToStore(store, 'a', '1', () => 0);
      store.finishConfiguring();

      expect(store.getSelection()).toEqual(undefined);
      store.setSelection({ storyId: 'a--1', viewMode: 'story' });
      expect(store.getSelection()).toEqual({ storyId: 'a--1', viewMode: 'story' });

      store.startConfiguring();
      store.removeStoryKind('a');
      addStoryToStore(store, 'a', '1', () => 0);
      addStoryToStore(store, 'a', '2', () => 0);
      store.finishConfiguring();

      expect(store.getSelection()).toEqual({ storyId: 'a--1', viewMode: 'story' });
    });
  });
});

describe('storySort', () => {
  it('sorts stories using given function', () => {
    const store = new StoryStore({ channel });
    addReverseSorting(store);
    addStoryToStore(store, 'a/a', '1', () => 0);
    addStoryToStore(store, 'a/a', '2', () => 0);
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'b/b1', '1', () => 0);
    addStoryToStore(store, 'b/b10', '1', () => 0);
    addStoryToStore(store, 'b/b9', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'c--1',
      'b-b10--1',
      'b-b9--1',
      'b-b1--1',
      'a-b--1',
      'a-a--1',
      'a-a--2',
    ]);
  });

  it('sorts stories alphabetically', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'alphabetical',
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a/a', '2', () => 0);
    addStoryToStore(store, 'a/a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/b10', '1', () => 0);
    addStoryToStore(store, 'b/b9', '1', () => 0);
    addStoryToStore(store, 'b/b1', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'a-a--2',
      'a-a--1',
      'a-b--1',
      'b-b1--1',
      'b-b9--1',
      'b-b10--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order or alphabetically', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'alphabetical',
            order: ['b', ['bc', 'ba', 'bb'], 'a', 'c'],
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b--1',
      'b-bc--1',
      'b-ba--1',
      'b-bb--1',
      'b-bd--1',
      'a--1',
      'a-b--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order or alphabetically with wildcards', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'alphabetical',
            order: ['b', ['bc', '*', 'bb'], '*', 'c'],
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b--1',
      'b-bc--1',
      'b-ba--1',
      'b-bd--1',
      'b-bb--1',
      'a--1',
      'a-b--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order or by configure order', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'configure',
            order: ['b', 'a', 'c'],
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b--1',
      'b-bd--1',
      'b-bb--1',
      'b-ba--1',
      'b-bc--1',
      'a--1',
      'a-b--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order or by configure order with wildcard', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'configure',
            order: ['b', '*', 'c'],
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);
    addStoryToStore(store, 'e', '1', () => 0);
    addStoryToStore(store, 'd', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b--1',
      'b-bd--1',
      'b-bb--1',
      'b-ba--1',
      'b-bc--1',
      'a--1',
      'a-b--1',
      'e--1',
      'd--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order including story names or configure', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'configure',
            order: ['b', ['bc', 'ba', 'bb'], 'a', 'c'],
            includeNames: true,
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '2', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b-bc--1',
      'b-ba--1',
      'b-bb--1',
      'b-bd--1',
      'b--1',
      'a-b--1',
      'a--2',
      'a--1',
      'c--1',
    ]);
  });

  it('sorts stories in specified order including story names or alphabetically', () => {
    const store = new StoryStore({ channel });
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort: {
            method: 'alphabetical',
            order: ['b', ['bc', 'ba', 'bb'], 'a', 'c'],
            includeNames: true,
          },
        },
      },
    });
    addStoryToStore(store, 'a/b', '1', () => 0);
    addStoryToStore(store, 'a', '2', () => 0);
    addStoryToStore(store, 'a', '1', () => 0);
    addStoryToStore(store, 'c', '1', () => 0);
    addStoryToStore(store, 'b/bd', '1', () => 0);
    addStoryToStore(store, 'b/bb', '1', () => 0);
    addStoryToStore(store, 'b/ba', '1', () => 0);
    addStoryToStore(store, 'b/bc', '1', () => 0);
    addStoryToStore(store, 'b', '1', () => 0);

    const extracted = store.extract();

    expect(Object.keys(extracted)).toEqual([
      'b-bc--1',
      'b-ba--1',
      'b-bb--1',
      'b--1',
      'b-bd--1',
      'a--1',
      'a--2',
      'a-b--1',
      'c--1',
    ]);
  });

  it('passes kind and global parameters to sort', () => {
    const store = new StoryStore({ channel });
    const storySort = jest.fn();
    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        options: {
          storySort,
        },
        global: 'global',
      },
    });
    store.addKindMetadata('a', { parameters: { kind: 'kind' }, decorators: [] });
    addStoryToStore(store, 'a', '1', () => 0, { story: '1' });
    addStoryToStore(store, 'a', '2', () => 0, { story: '2' });
    const extracted = store.extract();

    expect(storySort).toHaveBeenCalledWith(
      [
        'a--1',
        expect.objectContaining({
          parameters: expect.objectContaining({ story: '1' }),
        }),
        { kind: 'kind' },
        expect.objectContaining({ global: 'global' }),
      ],
      [
        'a--2',
        expect.objectContaining({
          parameters: expect.objectContaining({ story: '2' }),
        }),
        { kind: 'kind' },
        expect.objectContaining({ global: 'global' }),
      ]
    );
  });
});

describe('configuration', () => {
  it('does not allow addStory if not configuring, unless allowUsafe=true', () => {
    const store = new StoryStore({ channel });
    store.finishConfiguring();

    expect(() => addStoryToStore(store, 'a', '1', () => 0)).toThrow(
      'Cannot add a story when not configuring'
    );

    expect(() =>
      store.addStory(
        {
          kind: 'a',
          name: '1',
          storyFn: () => 0,
          parameters: {},
          id: 'a--1',
        },
        {
          applyDecorators: defaultDecorateStory,
          allowUnsafe: true,
        }
      )
    ).not.toThrow();
  });

  it('does not allow remove if not configuring, unless allowUsafe=true', () => {
    const store = new StoryStore({ channel });
    addons.setChannel(channel);
    addStoryToStore(store, 'a', '1', () => 0);
    store.finishConfiguring();

    expect(() => store.remove('a--1')).toThrow('Cannot remove a story when not configuring');
    expect(() => store.remove('a--1', { allowUnsafe: true })).not.toThrow();
  });

  it('does not allow removeStoryKind if not configuring, unless allowUsafe=true', () => {
    const store = new StoryStore({ channel });
    addons.setChannel(channel);
    addStoryToStore(store, 'a', '1', () => 0);
    store.finishConfiguring();

    expect(() => store.removeStoryKind('a')).toThrow('Cannot remove a kind when not configuring');
    expect(() => store.removeStoryKind('a', { allowUnsafe: true })).not.toThrow();
  });

  it('waits for configuration to be over before emitting SET_STORIES', () => {
    const onSetStories = jest.fn();
    channel.on(Events.SET_STORIES, onSetStories);
    const store = new StoryStore({ channel });

    addStoryToStore(store, 'a', '1', () => 0);
    expect(onSetStories).not.toHaveBeenCalled();

    store.finishConfiguring();
    expect(onSetStories).toHaveBeenCalledWith({
      v: 2,
      globals: {},
      globalParameters: {},
      kindParameters: { a: {} },
      stories: {
        'a--1': expect.objectContaining({
          id: 'a--1',
        }),
      },
    });
  });

  it('correctly emits globals with SET_STORIES', () => {
    const onSetStories = jest.fn();
    channel.on(Events.SET_STORIES, onSetStories);
    const store = new StoryStore({ channel });

    store.addGlobalMetadata({
      decorators: [],
      parameters: {
        globalTypes: {
          arg1: { defaultValue: 'arg1' },
        },
      },
    });

    addStoryToStore(store, 'a', '1', () => 0);
    expect(onSetStories).not.toHaveBeenCalled();

    store.finishConfiguring();
    expect(onSetStories).toHaveBeenCalledWith({
      v: 2,
      globals: { arg1: 'arg1' },
      globalParameters: {
        // NOTE: Currently globalArg[Types] are emitted as parameters but this may not remain
        globalTypes: {
          arg1: { defaultValue: 'arg1' },
        },
      },
      kindParameters: { a: {} },
      stories: {
        'a--1': expect.objectContaining({
          id: 'a--1',
        }),
      },
    });
  });

  it('emits an empty SET_STORIES if no stories were added during configuration', () => {
    const onSetStories = jest.fn();
    channel.on(Events.SET_STORIES, onSetStories);
    const store = new StoryStore({ channel });

    store.finishConfiguring();
    expect(onSetStories).toHaveBeenCalledWith({
      v: 2,
      globals: {},
      globalParameters: {},
      kindParameters: {},
      stories: {},
    });
  });

  it('allows configuration as second time (HMR)', () => {
    const onSetStories = jest.fn();
    channel.on(Events.SET_STORIES, onSetStories);
    const store = new StoryStore({ channel });
    store.finishConfiguring();

    onSetStories.mockClear();
    store.startConfiguring();
    addStoryToStore(store, 'a', '1', () => 0);
    store.finishConfiguring();

    expect(onSetStories).toHaveBeenCalledWith({
      v: 2,
      globals: {},
      globalParameters: {},
      kindParameters: { a: {} },
      stories: {
        'a--1': expect.objectContaining({
          id: 'a--1',
        }),
      },
    });
  });
});
