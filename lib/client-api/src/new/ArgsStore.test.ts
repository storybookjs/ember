import { ArgsStore } from './ArgsStore';

describe('ArgsStore', () => {
  describe('setInitial / get', () => {
    it('returns in a straightforward way', () => {
      const store = new ArgsStore();
      store.setInitial('id', { foo: 'bar' });
      expect(store.get('id')).toEqual({ foo: 'bar' });
    });

    it('does not allow re-setting', () => {
      const store = new ArgsStore();
      store.setInitial('id', { foo: 'bar' });
      store.setInitial('id', { foo: 'baz' });
      expect(store.get('id')).toEqual({ foo: 'bar' });
    });

    it('throws if you try to get non-existent', () => {
      const store = new ArgsStore();
      expect(() => store.get('id')).toThrow(/No args known/);
    });
  });

  describe('update', () => {
    it('overrides on a per-key basis', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      store.update('id', { foo: 'bar' });
      expect(store.get('id')).toEqual({ foo: 'bar' });

      store.update('id', { baz: 'bing' });
      expect(store.get('id')).toEqual({ foo: 'bar', baz: 'bing' });
    });

    it('does not merge objects', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      store.update('id', { obj: { foo: 'bar' } });
      expect(store.get('id')).toEqual({ obj: { foo: 'bar' } });

      store.update('id', { obj: { baz: 'bing' } });
      expect(store.get('id')).toEqual({ obj: { baz: 'bing' } });
    });
  });

  describe('updateFromPersisted', () => {
    it('ensures the types of args are correct', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      const story = {
        id: 'id',
        argTypes: { a: { type: { name: 'string' } } },
      } as any;
      store.updateFromPersisted(story, { a: 'str' });
      expect(store.get('id')).toEqual({ a: 'str' });

      store.updateFromPersisted(story, { a: 42 });
      expect(store.get('id')).toEqual({ a: '42' });
    });

    it('merges objects and sparse arrays', () => {
      const store = new ArgsStore();

      store.setInitial('id', {
        a: { foo: 'bar' },
        b: ['1', '2', '3'],
      });

      const story = {
        id: 'id',
        argTypes: {
          a: { type: { name: 'object', value: { name: 'string' } } },
          b: { type: { name: 'array', value: { name: 'string' } } },
        },
      } as any;
      store.updateFromPersisted(story, { a: { baz: 'bing' } });
      expect(store.get('id')).toEqual({
        a: { foo: 'bar', baz: 'bing' },
        b: ['1', '2', '3'],
      });

      // eslint-disable-next-line no-sparse-arrays
      store.updateFromPersisted(story, { b: [, , '4'] });
      expect(store.get('id')).toEqual({
        a: { foo: 'bar', baz: 'bing' },
        b: ['1', '2', '4'],
      });
    });
  });
});
