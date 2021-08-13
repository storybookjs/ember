import { StoriesListStore } from './StoriesListStore';
import { StoriesList } from './types';

jest.mock('@storybook/channel-websocket', () => () => ({ on: jest.fn() }));

const stories: StoriesList = {
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
const fetchStoriesList = async () => stories;

const makeFetchStoriesList = (titlesAndNames) => {
  return async () => ({
    v: 3,
    stories: Object.fromEntries(
      titlesAndNames.map(([title, name]) => [
        `${title}--${name}`.replace('/', '-'), // poor man's sanitize
        {
          title,
          name,
          importPath: `./src/${title}.stories.js`,
        },
      ])
    ),
  });
};

describe('StoriesListStore', () => {
  describe('storyIdFromSpecifier', () => {
    describe('if you use *', () => {
      it('selects the first story in the store', async () => {
        const store = new StoriesListStore({ fetchStoriesList });
        await store.initialize();

        expect(store.storyIdFromSpecifier('*')).toEqual('component-one--a');
      });

      it('selects nothing if there are no stories', async () => {
        const store = new StoriesListStore({
          fetchStoriesList: makeFetchStoriesList([]),
        });
        await store.initialize();

        expect(store.storyIdFromSpecifier('*')).toBeUndefined();
      });
    });

    describe('if you use a component or group id', () => {
      it('selects the first story for the component', async () => {
        const store = new StoriesListStore({ fetchStoriesList });
        await store.initialize();

        expect(store.storyIdFromSpecifier('component-two')).toEqual('component-two--c');
      });

      it('selects the first story for the group', async () => {
        const store = new StoriesListStore({
          fetchStoriesList: makeFetchStoriesList([
            ['g1/a', '1'],
            ['g2/a', '1'],
            ['g2/b', '1'],
          ]),
        });
        await store.initialize();

        expect(store.storyIdFromSpecifier('g2')).toEqual('g2-a--1');
      });

      // Making sure the fix #11571 doesn't break this
      it('selects the first story if there are two stories in the group of different lengths', async () => {
        const store = new StoriesListStore({
          fetchStoriesList: makeFetchStoriesList([
            ['a', 'long-long-long'],
            ['a', 'short'],
          ]),
        });
        await store.initialize();

        expect(store.storyIdFromSpecifier('a')).toEqual('a--long-long-long');
      });

      it('selects nothing if the component or group does not exist', async () => {
        const store = new StoriesListStore({ fetchStoriesList });
        await store.initialize();

        expect(store.storyIdFromSpecifier('random')).toBeUndefined();
      });
    });
    describe('if you use a storyId', () => {
      it('selects a specific story', async () => {
        const store = new StoriesListStore({ fetchStoriesList });
        await store.initialize();

        expect(store.storyIdFromSpecifier('component-one--a')).toEqual('component-one--a');
      });

      it('selects nothing if you the story does not exist', async () => {
        const store = new StoriesListStore({ fetchStoriesList });
        await store.initialize();

        expect(store.storyIdFromSpecifier('component-one--c')).toBeUndefined();
      });

      // See #11571
      it('does NOT select an earlier story that this story id is a prefix of', async () => {
        const store = new StoriesListStore({
          fetchStoriesList: makeFetchStoriesList([
            ['a', '31'],
            ['a', '3'],
          ]),
        });
        await store.initialize();

        expect(store.storyIdFromSpecifier('a--3')).toEqual('a--3');
      });
    });
  });

  describe('storyIdToCSFFilePath', () => {
    it('works when the story exists', async () => {
      const store = new StoriesListStore({ fetchStoriesList });
      await store.initialize();

      expect(store.storyIdToCSFFilePath('component-one--a')).toEqual(
        './src/ComponentOne.stories.js'
      );

      expect(store.storyIdToCSFFilePath('component-one--b')).toEqual(
        './src/ComponentOne.stories.js'
      );

      expect(store.storyIdToCSFFilePath('component-two--c')).toEqual(
        './src/ComponentTwo.stories.js'
      );
    });

    it('throws when the story does not', async () => {
      const store = new StoriesListStore({ fetchStoriesList });
      await store.initialize();

      expect(() => store.storyIdToCSFFilePath('random')).toThrow(/Didn't find 'random'/);
    });
  });
});
