import path from 'path';
import { normalizeStoriesEntry, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { readCsfOrMdx, getStorySortParameter } from '@storybook/csf-tools';

import { StoryIndexGenerator } from './StoryIndexGenerator';

jest.mock('@storybook/csf-tools');

const readCsfOrMdxMock = readCsfOrMdx as jest.Mock<ReturnType<typeof readCsfOrMdx>>;
const getStorySortParameterMock = getStorySortParameter as jest.Mock<
  ReturnType<typeof getStorySortParameter>
>;

const options = {
  configDir: path.join(__dirname, '__mockdata__'),
  workingDir: path.join(__dirname, '__mockdata__'),
  storiesV2Compatibility: false,
  storyStoreV7: true,
};

describe('StoryIndexGenerator', () => {
  beforeEach(() => {
    const actual = jest.requireActual('@storybook/csf-tools');
    readCsfOrMdxMock.mockImplementation(actual.readCsfOrMdx);
  });
  describe('extraction', () => {
    describe('single file specifier', () => {
      it('extracts stories from the right files', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/A.stories.js',
          options
        );

        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();

        expect(await generator.getIndex()).toMatchInlineSnapshot(`
          Object {
            "stories": Object {
              "a--story-one": Object {
                "id": "a--story-one",
                "importPath": "./src/A.stories.js",
                "name": "Story One",
                "title": "A",
              },
            },
            "v": 3,
          }
        `);
      });
    });
    describe('non-recursive specifier', () => {
      it('extracts stories from the right files', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/*/*.stories.(ts|js|jsx)',
          options
        );

        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();

        expect(await generator.getIndex()).toMatchInlineSnapshot(`
          Object {
            "stories": Object {
              "nested-button--story-one": Object {
                "id": "nested-button--story-one",
                "importPath": "./src/nested/Button.stories.ts",
                "name": "Story One",
                "title": "Nested/Button",
              },
              "second-nested-f--story-one": Object {
                "id": "second-nested-f--story-one",
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

    describe('recursive specifier', () => {
      it('extracts stories from the right files', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/**/*.stories.(ts|js|jsx)',
          options
        );

        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();

        expect(await generator.getIndex()).toMatchInlineSnapshot(`
          Object {
            "stories": Object {
              "a--story-one": Object {
                "id": "a--story-one",
                "importPath": "./src/A.stories.js",
                "name": "Story One",
                "title": "A",
              },
              "b--story-one": Object {
                "id": "b--story-one",
                "importPath": "./src/B.stories.ts",
                "name": "Story One",
                "title": "B",
              },
              "d--story-one": Object {
                "id": "d--story-one",
                "importPath": "./src/D.stories.jsx",
                "name": "Story One",
                "title": "D",
              },
              "nested-button--story-one": Object {
                "id": "nested-button--story-one",
                "importPath": "./src/nested/Button.stories.ts",
                "name": "Story One",
                "title": "Nested/Button",
              },
              "second-nested-f--story-one": Object {
                "id": "second-nested-f--story-one",
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
  });

  describe('sorting', () => {
    it('runs a user-defined sort function', async () => {
      const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
        './src/**/*.stories.(ts|js|jsx)',
        options
      );

      const generator = new StoryIndexGenerator([specifier], options);
      await generator.initialize();

      (getStorySortParameter as jest.Mock).mockReturnValueOnce({
        order: ['D', 'B', 'Nested', 'A', 'Second Nested'],
      });

      expect(Object.keys((await generator.getIndex()).stories)).toEqual([
        'd--story-one',
        'b--story-one',
        'nested-button--story-one',
        'a--story-one',
        'second-nested-f--story-one',
      ]);
    });
  });

  describe('caching', () => {
    describe('no invalidation', () => {
      it('does not extract csf files a second time', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/**/*.stories.(ts|js|jsx)',
          options
        );

        readCsfOrMdxMock.mockClear();
        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();
        await generator.getIndex();
        expect(readCsfOrMdxMock).toHaveBeenCalledTimes(6);

        readCsfOrMdxMock.mockClear();
        await generator.getIndex();
        expect(readCsfOrMdxMock).not.toHaveBeenCalled();
      });

      it('does not call the sort function a second time', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/**/*.stories.(ts|js|jsx)',
          options
        );

        const sortFn = jest.fn();
        getStorySortParameterMock.mockReturnValue(sortFn);
        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();
        await generator.getIndex();
        expect(sortFn).toHaveBeenCalled();

        sortFn.mockClear();
        await generator.getIndex();
        expect(sortFn).not.toHaveBeenCalled();
      });
    });

    describe('file changed', () => {
      it('calls extract csf file for just the one file', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/**/*.stories.(ts|js|jsx)',
          options
        );

        readCsfOrMdxMock.mockClear();
        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();
        await generator.getIndex();
        expect(readCsfOrMdxMock).toHaveBeenCalledTimes(6);

        generator.invalidate(specifier, './src/B.stories.ts', false);

        readCsfOrMdxMock.mockClear();
        await generator.getIndex();
        expect(readCsfOrMdxMock).toHaveBeenCalledTimes(1);
      });

      it('does call the sort function a second time', async () => {
        const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
          './src/**/*.stories.(ts|js|jsx)',
          options
        );

        const sortFn = jest.fn();
        getStorySortParameterMock.mockReturnValue(sortFn);
        const generator = new StoryIndexGenerator([specifier], options);
        await generator.initialize();
        await generator.getIndex();
        expect(sortFn).toHaveBeenCalled();

        generator.invalidate(specifier, './src/B.stories.ts', false);

        sortFn.mockClear();
        await generator.getIndex();
        expect(sortFn).toHaveBeenCalled();
      });

      describe('file removed', () => {
        it('does not extract csf files a second time', async () => {
          const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
            './src/**/*.stories.(ts|js|jsx)',
            options
          );

          readCsfOrMdxMock.mockClear();
          const generator = new StoryIndexGenerator([specifier], options);
          await generator.initialize();
          await generator.getIndex();
          expect(readCsfOrMdxMock).toHaveBeenCalledTimes(6);

          generator.invalidate(specifier, './src/B.stories.ts', true);

          readCsfOrMdxMock.mockClear();
          await generator.getIndex();
          expect(readCsfOrMdxMock).not.toHaveBeenCalled();
        });

        it('does call the sort function a second time', async () => {
          const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
            './src/**/*.stories.(ts|js|jsx)',
            options
          );

          const sortFn = jest.fn();
          getStorySortParameterMock.mockReturnValue(sortFn);
          const generator = new StoryIndexGenerator([specifier], options);
          await generator.initialize();
          await generator.getIndex();
          expect(sortFn).toHaveBeenCalled();

          generator.invalidate(specifier, './src/B.stories.ts', true);

          sortFn.mockClear();
          await generator.getIndex();
          expect(sortFn).toHaveBeenCalled();
        });

        it('does not include the deleted stories in results', async () => {
          const specifier: NormalizedStoriesSpecifier = normalizeStoriesEntry(
            './src/**/*.stories.(ts|js|jsx)',
            options
          );

          readCsfOrMdxMock.mockClear();
          const generator = new StoryIndexGenerator([specifier], options);
          await generator.initialize();
          await generator.getIndex();
          expect(readCsfOrMdxMock).toHaveBeenCalledTimes(6);

          generator.invalidate(specifier, './src/B.stories.ts', true);

          expect(Object.keys((await generator.getIndex()).stories)).not.toContain('b--story-one');
        });
      });
    });
  });
});
