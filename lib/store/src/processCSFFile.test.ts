import { processCSFFile } from './processCSFFile';

const entries = [{ specifier: { directory: './path/', titlePrefix: 'Prefix' } }];

describe('processCSFFile', () => {
  it('returns a CSFFile object with meta and stories', () => {
    const { meta, stories } = processCSFFile(
      {
        default: { title: 'Component' },
        storyOne: { args: { a: 1 } },
        storyTwo: { args: { a: 2 } },
      },
      './path/to/file.stories.js',
      entries
    );

    expect(meta).toEqual({ id: 'component', title: 'Component' });
    expect(stories).toEqual({
      'component--story-one': { id: 'component--story-one', name: 'Story One', args: { a: 1 } },
      'component--story-two': { id: 'component--story-two', name: 'Story Two', args: { a: 2 } },
    });
  });

  it('automatically sets title if undefined', () => {
    const { meta } = processCSFFile(
      {
        default: {},
        storyOne: {},
      },
      './path/to/file.stories.js',
      entries
    );

    expect(meta).toEqual({ id: 'prefix-to-file', title: 'Prefix/to/file' });
  });

  it('adds stories in the right order if __namedExportsOrder is supplied', () => {
    const { stories } = processCSFFile(
      {
        default: { title: 'Component' },
        x: () => 0,
        y: () => 0,
        z: () => 0,
        w: () => 0,
        __namedExportsOrder: ['w', 'x', 'z', 'y'],
      },
      './path/to/file.stories.js',
      entries
    );

    expect(Object.keys(stories)).toEqual([
      'component--w',
      'component--x',
      'component--z',
      'component--y',
    ]);
  });

  it('filters exports using includeStories array', () => {
    const { stories } = processCSFFile(
      {
        default: { title: 'Component', includeStories: ['x', 'z'] },
        x: () => 0,
        y: () => 0,
        z: () => 0,
        w: () => 0,
      },
      './path/to/file.stories.js',
      entries
    );

    expect(Object.keys(stories)).toEqual(['component--x', 'component--z']);
  });

  it('filters exports using includeStories regex', () => {
    const { stories } = processCSFFile(
      {
        default: { title: 'Component', includeStories: /^(x|z)$/ },
        x: () => 0,
        y: () => 0,
        z: () => 0,
        w: () => 0,
      },
      './path/to/file.stories.js',
      entries
    );

    expect(Object.keys(stories)).toEqual(['component--x', 'component--z']);
  });

  it('filters exports using excludeStories array', () => {
    const { stories } = processCSFFile(
      {
        default: { title: 'Component', excludeStories: ['x', 'z'] },
        x: () => 0,
        y: () => 0,
        z: () => 0,
        w: () => 0,
      },
      './path/to/file.stories.js',
      entries
    );

    expect(Object.keys(stories)).toEqual(['component--y', 'component--w']);
  });

  it('filters exports using excludeStories regex', () => {
    const { stories } = processCSFFile(
      {
        default: { title: 'Component', excludeStories: /^(x|z)$/ },
        x: () => 0,
        y: () => 0,
        z: () => 0,
        w: () => 0,
      },
      './path/to/file.stories.js',
      entries
    );

    expect(Object.keys(stories)).toEqual(['component--y', 'component--w']);
  });
});
