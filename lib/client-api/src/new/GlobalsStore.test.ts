import { GlobalsStore } from './GlobalsStore';

describe('GlobalsStore', () => {
  it('is initialized to the value in globals', () => {
    const store = new GlobalsStore({
      globals: {
        arg1: 'arg1',
        arg2: 2,
        arg3: { complex: { object: ['type'] } },
      },
      globalTypes: {},
    });

    expect(store.get()).toEqual({
      arg1: 'arg1',
      arg2: 2,
      arg3: { complex: { object: ['type'] } },
    });
  });

  it('is initialized to the default values from globalTypes if global is unset', () => {
    const store = new GlobalsStore({
      globals: {
        arg1: 'arg1',
        arg2: 2,
      },
      globalTypes: {
        arg2: { defaultValue: 'arg2' },
        arg3: { defaultValue: { complex: { object: ['type'] } } },
      },
    });

    expect(store.get()).toEqual({
      // NOTE: we keep arg1, even though it doesn't have a globalArgType
      arg1: 'arg1',
      arg2: 2,
      arg3: { complex: { object: ['type'] } },
    });
  });

  describe('update', () => {
    it('changes the global args', () => {
      const store = new GlobalsStore({ globals: {}, globalTypes: {} });

      store.update({ foo: 'bar' });
      expect(store.get()).toEqual({ foo: 'bar' });

      store.update({ baz: 'bing' });
      expect(store.get()).toEqual({ foo: 'bar', baz: 'bing' });
    });

    it('does not merge objects', () => {
      const store = new GlobalsStore({ globals: {}, globalTypes: {} });

      store.update({ obj: { foo: 'bar' } });
      expect(store.get()).toEqual({ obj: { foo: 'bar' } });

      store.update({ obj: { baz: 'bing' } });
      expect(store.get()).toEqual({ obj: { baz: 'bing' } });
    });
  });

  describe('updateFromPersisted', () => {
    it('only sets values for which globals or globalArgs exist', () => {
      const store = new GlobalsStore({
        globals: {
          arg1: 'arg1',
        },
        globalTypes: {
          arg2: { defaultValue: 'arg2' },
        },
      });

      store.updateFromPersisted({
        arg1: 'new-arg1',
        arg2: 'new-arg2',
        arg3: 'new-arg3',
      });

      expect(store.get()).toEqual({ arg1: 'new-arg1', arg2: 'new-arg2' });
    });
  });
});
