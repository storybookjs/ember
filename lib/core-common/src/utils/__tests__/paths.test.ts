import path from 'path';
import { normalizeStoryPath } from '../paths';

describe('paths - normalizeStoryPath()', () => {
  it('returns a path starting with "./" unchanged', () => {
    const filename = `./src/Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('returns a path starting with "../" unchanged', () => {
    const filename = `../src/Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(filename);
  });

  it('adds "./" to a normalized relative path', () => {
    const filename = `src/Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`./${filename}`);
  });

  it('adds "./" to a hidden folder', () => {
    const filename = `.storybook/Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`./${filename}`);
  });

  it('adds "./" to a hidden file', () => {
    const filename = `.Comp.story.js`;
    expect(normalizeStoryPath(filename)).toEqual(`./${filename}`);
  });

  describe('windows paths', () => {
    it('returns a path starting with ".\\" unchanged', () => {
      const filename = `.\\src\\Comp.story.js`;
      expect(normalizeStoryPath(filename)).toEqual(filename);
    });

    it('returns a path starting with "..\\" unchanged', () => {
      const filename = `..\\src\\Comp.story.js`;
      expect(normalizeStoryPath(filename)).toEqual(filename);
    });

    it('adds ".{path.sep}" to a normalized relative path', () => {
      const filename = `src\\Comp.story.js`;
      expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
    });

    it('adds ".{path.sep}" to a hidden folder', () => {
      const filename = `.storybook\\Comp.story.js`;
      expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
    });

    it('adds ".{path.sep}" to a hidden file', () => {
      const filename = `.Comp.story.js`;
      expect(normalizeStoryPath(filename)).toEqual(`.${path.sep}${filename}`);
    });
  });
});
