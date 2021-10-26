import { webpackIncludeRegexp } from '../to-importFn';
import { normalizeStoriesEntry } from '../normalize-stories';

const testCases = [
  {
    glob: '**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: './**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: '../**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: 'src',
    validPaths: [],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: 'src/*',
    validPaths: ['/Users/user/code/src/Icon.stories.tsx'],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: './src/**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: '../src/**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: '../../src/**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
  {
    glob: './../../src/**/*.stories.tsx',
    validPaths: [
      '/Users/user/code/src/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories.tsx',
      '/Users/user/code/src/components/Icon.stories/Icon.stories.tsx',
    ],
    invalidPaths: [
      '/Users/user/code/Icon.stories.tsx',
      '/Users/user/code/stories.tsx',
      '/Users/user/code/Icon.stories.ts',
      '/Users/user/code/Icon.stories.js',
      '/Users/user/code/src/components/stories.tsx',
      '/Users/user/code/src/components/Icon.stories/stories.tsx',
      '/Users/user/code/src/components/Icon.stories.ts',
      '/Users/user/code/src/components/Icon.stories.js',
    ],
  },
];

describe('toImportFn - webpackIncludeRegexp', () => {
  testCases.forEach(({ glob, validPaths, invalidPaths }) => {
    it(`matches only suitable paths - ${glob}`, () => {
      const regex = webpackIncludeRegexp(
        normalizeStoriesEntry(glob, { configDir: '/path', workingDir: '/path' })
      );

      const isNotMatchedForValidPaths = validPaths.filter(
        (absolutePath) => !regex.test(absolutePath)
      );
      const isMatchedForInvalidPaths = invalidPaths.filter(
        (absolutePath) => !!regex.test(absolutePath)
      );

      expect(isNotMatchedForValidPaths).toEqual([]);
      expect(isMatchedForInvalidPaths).toEqual([]);
    });
  });
});
