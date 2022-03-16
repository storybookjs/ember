import { normalizeStoriesEntry } from '@storybook/core-common';

import { autoTitleFromSpecifier as auto, customTitleFromSpecifier as custom } from './autoTitle';

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
      ).toMatchInlineSnapshot(`to/file`);
    });

    it('match with titlePrefix', () => {
      expect(
        auto(
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });

    it('match with trailing duplicate', () => {
      expect(
        auto(
          './path/to/button/button.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`to/button`);
    });

    it('match with trailing index', () => {
      expect(
        auto(
          './path/to/button/index.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`to/button`);
    });

    it('match with hyphen path', () => {
      expect(
        auto(
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`to-my/file`);
    });

    it('match with underscore path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`to_my/file`);
    });

    it('match with windows path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path' }, winOptions)
        )
      ).toMatchInlineSnapshot(`to_my/file`);
    });
  });

  describe('trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        auto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options))
      ).toMatchInlineSnapshot(`to/file`);
    });

    it('match with titlePrefix', () => {
      expect(
        auto(
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });

    it('match with hyphen path', () => {
      expect(
        auto(
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/' }, options)
        )
      ).toMatchInlineSnapshot(`to-my/file`);
    });

    it('match with underscore path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/' }, options)
        )
      ).toMatchInlineSnapshot(`to_my/file`);
    });

    it('match with windows path', () => {
      expect(
        auto(
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path\\' }, winOptions)
        )
      ).toMatchInlineSnapshot(`to_my/file`);
    });

    it('camel-case file', () => {
      expect(
        auto(
          './path/to_my/MyButton.stories.js',
          normalizeStoriesEntry({ directory: './path' }, options)
        )
      ).toMatchInlineSnapshot(`to_my/MyButton`);
    });
  });
});

describe('customTitle', () => {
  it('no match', () => {
    expect(
      custom(undefined, './path/to/file.stories.js', normalizeStoriesEntry({ directory: './other' }, options))
    ).toBeFalsy();
  });

  describe('no trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        custom('title', './path/to/file.stories.js', normalizeStoriesEntry({ directory: './path' }, options))
      ).toMatchInlineSnapshot(`title`);
    });

    it('match with titlePrefix', () => {
      expect(
        custom(
          'title',
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with hyphen path', () => {
      expect(
        custom(
          'title',
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with underscore path', () => {
      expect(
        custom(
          'title',
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with windows path', () => {
      expect(
        custom(
          'title',
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path', titlePrefix: 'atoms' }, winOptions)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });
  });

  describe('trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        custom('title', './path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options))
      ).toMatchInlineSnapshot(`title`);
    });

    it('match with titlePrefix', () => {
      expect(
        custom(
          'title',
          './path/to/file.stories.js',
          normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with hyphen path', () => {
      expect(
        custom(
          'title',
          './path/to-my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with underscore path', () => {
      expect(
        custom(
          'title',
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });

    it('match with windows path', () => {
      expect(
        custom(
          'title',
          './path/to_my/file.stories.js',
          normalizeStoriesEntry({ directory: '.\\path\\', titlePrefix: 'atoms' }, winOptions)
        )
      ).toMatchInlineSnapshot(`atoms/title`);
    });
  });
});
