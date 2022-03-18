import { normalizeStoriesEntry } from '@storybook/core-common';

import { customOrAutoTitleFromSpecifier as customOrAuto } from './autoTitle';

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

describe('customOrAutoTitleFromSpecifier', () => {

  describe('custom title', () => {
    it('no match', () => {
      expect(
        customOrAuto('./ path / to / file.stories.js', normalizeStoriesEntry({ directory: './ other' }, options), 'title')
      ).toBeFalsy();
    });

    describe('no trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path' }, options), 'title')
        ).toMatchInlineSnapshot(`title`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path', titlePrefix: 'atoms' }, winOptions),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });
    });

    describe('trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options), 'title')
        ).toMatchInlineSnapshot(`title`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path\\', titlePrefix: 'atoms' }, winOptions),
            'title'
          )
        ).toMatchInlineSnapshot(`atoms/title`);
      });
    });
  });

  describe('auto title', () => {
    it('no match', () => {
      expect(
        customOrAuto('./ path / to / file.stories.js', normalizeStoriesEntry({ directory: './ other' }, options), undefined)
      ).toBeFalsy();
    });

    describe('no trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path' }, options), undefined)
        ).toMatchInlineSnapshot(`to/file`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`atoms/to/file`);
      });

      it('match with trailing duplicate', () => {
        expect(
          customOrAuto(
            './path/to/button/button.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to/button`);
      });

      it('match with trailing index', () => {
        expect(
          customOrAuto(
            './path/to/button/index.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to/button`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to-my/file`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path' }, winOptions),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });
    });

    describe('trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options), undefined)
        ).toMatchInlineSnapshot(`to/file`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`atoms/to/file`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to-my/file`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path\\' }, winOptions),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('camel-case file', () => {
        expect(
          customOrAuto(
            './path/to_my/MyButton.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/MyButton`);
      });
    });

    describe('no trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path' }, options), undefined)
        ).toMatchInlineSnapshot(`to/file`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path', titlePrefix: 'atoms' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`atoms/to/file`);
      });

      it('match with trailing duplicate', () => {
        expect(
          customOrAuto(
            './path/to/button/button.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to/button`);
      });

      it('match with trailing index', () => {
        expect(
          customOrAuto(
            './path/to/button/index.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to/button`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to-my/file`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path' }, winOptions),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });
    });

    describe('trailing slash', () => {
      it('match with no titlePrefix', () => {
        expect(
          customOrAuto('./path/to/file.stories.js', normalizeStoriesEntry({ directory: './path/' }, options), undefined)
        ).toMatchInlineSnapshot(`to/file`);
      });

      it('match with titlePrefix', () => {
        expect(
          customOrAuto(
            './path/to/file.stories.js',
            normalizeStoriesEntry({ directory: './path/', titlePrefix: 'atoms' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`atoms/to/file`);
      });

      it('match with hyphen path', () => {
        expect(
          customOrAuto(
            './path/to-my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to-my/file`);
      });

      it('match with underscore path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: './path/' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('match with windows path', () => {
        expect(
          customOrAuto(
            './path/to_my/file.stories.js',
            normalizeStoriesEntry({ directory: '.\\path\\' }, winOptions),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/file`);
      });

      it('camel-case file', () => {
        expect(
          customOrAuto(
            './path/to_my/MyButton.stories.js',
            normalizeStoriesEntry({ directory: './path' }, options),
            undefined
          )
        ).toMatchInlineSnapshot(`to_my/MyButton`);
      });
    });
  });
});
