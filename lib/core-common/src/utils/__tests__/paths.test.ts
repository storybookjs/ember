import path from 'path';
import { normalizeStoryPath } from '../paths';

describe('paths - normalizeStoryPath()', () => {
  it('returns a path starting with "./" unchanged', () => {
    // ./src/Comp.story.js
    const filename = `.${path.sep}src${path.sep}Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path starting with "../" unchanged', () => {
    // ../src/Comp.story.js
    const filename = `..${path.sep}src${path.sep}Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('adds "./" to a normalized relative path', () => {
    // src/Comp.story.js
    const filename = `src${path.sep}Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });

  it('adds "./" to a hidden folder', () => {
    // .storybook/Comp.story.js
    const filename = `.storybook${path.sep}Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });

  it('adds "./" to a hidden file', () => {
    // .storybook/Comp.story.js
    const filename = `.Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });
});
