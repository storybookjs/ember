import { autoTitle } from './autoTitle';

expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => true,
});

describe('autoTitle', () => {
  it('no directory', () => {
    expect(autoTitle({}, '/path/to/file', [{ glob: '' }])).toBeUndefined();
  });

  it('no match', () => {
    expect(
      autoTitle({}, '/path/to/file', [{ glob: '', specifier: { directory: '/other' } }])
    ).toBeUndefined();
  });

  describe('no trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        autoTitle({}, '/path/to/file', [{ glob: '', specifier: { directory: '/path' } }])
      ).toMatchInlineSnapshot(`to/file`);
    });

    it('match with titlePrefix', () => {
      expect(
        autoTitle({}, '/path/to/file', [
          {
            glob: '',
            specifier: { directory: '/path', titlePrefix: 'atoms' },
          },
        ])
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });

    it('match with extension', () => {
      expect(
        autoTitle({}, '/path/to/file.stories.tsx', [
          {
            glob: '',
            specifier: { directory: '/path', titlePrefix: 'atoms' },
          },
        ])
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });
  });

  describe('trailing slash', () => {
    it('match with no titlePrefix', () => {
      expect(
        autoTitle({}, '/path/to/file', [{ glob: '', specifier: { directory: '/path/' } }])
      ).toMatchInlineSnapshot(`to/file`);
    });

    it('match with titlePrefix', () => {
      expect(
        autoTitle({}, '/path/to/file', [
          {
            glob: '',
            specifier: { directory: '/path/', titlePrefix: 'atoms' },
          },
        ])
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });

    it('match with extension', () => {
      expect(
        autoTitle({}, '/path/to/file.stories.tsx', [
          {
            glob: '',
            specifier: { directory: '/path/', titlePrefix: 'atoms' },
          },
        ])
      ).toMatchInlineSnapshot(`atoms/to/file`);
    });
  });
});
