import { normalizeStoriesEntry } from '@storybook/core-common';

import { autoTitleFromSpecifier as auto } from './autoTitle';

expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => true,
});

// Make these two the same so `normalizeStoriesEntry` doesn't change anything
const options = {
  configDir: '/path',
  workingDir: '/path',
};
const winOptions = {
  configDir: '\\path',
  workingDir: '\\path',
};

describe('autoTitle', () => {
  it('no match', () => {
    expect(
      auto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './other' }, options))
    ).toBeFalsy();
  });

  describe('no trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        auto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path' }, options))
      ).toMatchInlineSnapshot(`To/File`);
    });

    it('match with titlePrefix', () => {
      expect(
        auto(
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`Atoms/To/File`);
    });

    it('match with hyphen path', () => {
      expect(
        auto(
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });

    it('match with underscore path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });

    it('match with windows path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path' }, winOptions)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });
  });

  describe('trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        auto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options))
      ).toMatchInlineSnapshot(`To/File`);
    });

    it('match with titlePrefix', () => {
      expect(
        auto(
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`Atoms/To/File`);
    });

    it('match with hyphen path', () => {
      expect(
        auto(
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/' }, options)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });

    it('match with underscore path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/' }, options)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });

    it('match with windows path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path\\' }, winOptions)
        )
      ).toMatchInlineSnapshot(`To My/File`);
    });
  });
});
