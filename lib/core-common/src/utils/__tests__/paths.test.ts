import path from 'path';
import { normalizeStoryPath } from '../paths';

describe('paths - normalizeStoryPath()', () => {
  it('returns a path starting with "./" unchanged', () => {
    const filename = `.${path.sep}${path.join('src', 'Comp.story.js')}`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path starting with "../" unchanged', () => {
    const filename = path.join('..', 'src', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('adds "./" to a normalized relative path', () => {
    const filename = path.join('src', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });

  it('adds "./" to a hidden folder', () => {
    const filename = path.join('.storybook', 'Comp.story.js');
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });

  it('adds "./" to a hidden file', () => {
    const filename = `.Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
  });
});
