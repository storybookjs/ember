import { normalizeStoriesEntry } from '../normalize-stories';

expect.addSnapshotSerializer({
  print: (val: any) => JSON.stringify(val, null, 2),
  test: (val) => typeof val !== 'string',
});

jest.mock('path', () => ({
  resolve: () => 'dummy',
}));

jest.mock('fs', () => ({
  lstatSync: () => ({
    isDirectory: () => true,
  }),
}));

describe('normalizeStoriesEntry', () => {
  it('glob', () => {
    expect(normalizeStoriesEntry('../**/*.stories.mdx', '')).toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.mdx"
      }
    `);
  });

  it('directory', () => {
    expect(normalizeStoriesEntry('..', '')).toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.@(mdx|tsx|ts|jsx|js)",
        "specifier": {
          "directory": "..",
          "root": "",
          "files": "*.stories.@(mdx|tsx|ts|jsx|js)"
        }
      }
    `);
  });

  it('directory specifier', () => {
    expect(normalizeStoriesEntry({ directory: '..' }, '')).toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.@(mdx|tsx|ts|jsx|js)",
        "specifier": {
          "directory": "..",
          "root": "",
          "files": "*.stories.@(mdx|tsx|ts|jsx|js)"
        }
      }
    `);
  });

  it('directory/files specifier', () => {
    expect(normalizeStoriesEntry({ directory: '..', files: '*.stories.mdx' }, ''))
      .toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.mdx",
        "specifier": {
          "directory": "..",
          "root": "",
          "files": "*.stories.mdx"
        }
      }
    `);
  });

  it('directory/root specifier', () => {
    expect(normalizeStoriesEntry({ directory: '..', root: 'atoms' }, '')).toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.@(mdx|tsx|ts|jsx|js)",
        "specifier": {
          "directory": "..",
          "root": "atoms",
          "files": "*.stories.@(mdx|tsx|ts|jsx|js)"
        }
      }
    `);
  });

  it('directory/root/files specifier', () => {
    expect(normalizeStoriesEntry({ directory: '..', root: 'atoms', files: '*.stories.mdx' }, ''))
      .toMatchInlineSnapshot(`
      {
        "glob": "../**/*.stories.mdx",
        "specifier": {
          "directory": "..",
          "root": "atoms",
          "files": "*.stories.mdx"
        }
      }
    `);
  });
});
