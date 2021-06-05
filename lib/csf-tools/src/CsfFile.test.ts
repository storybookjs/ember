import dedent from 'ts-dedent';
import yaml from 'js-yaml';
import { loadCsf } from './CsfFile';

// @ts-ignore
expect.addSnapshotSerializer({
  print: (val: any) => yaml.dump(val).trimEnd(),
  test: (val) => typeof val !== 'string',
});

const parse = async (code: string, includeParameters?: boolean) => {
  const { stories, meta } = (await loadCsf(code)).parse();
  const filtered = includeParameters
    ? stories
    : stories.map(({ id, name, parameters, ...rest }) => ({ id, name, ...rest }));
  return { meta, stories: filtered };
};

describe('csf extract', () => {
  describe('basic', () => {
    it('args stories', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = () => {};
          export const B = (args) => {};
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--a
            name: A
            parameters:
              __isArgsStory: false
              __id: foo-bar--a
          - id: foo-bar--b
            name: B
            parameters:
              __isArgsStory: true
              __id: foo-bar--b
      `);
    });

    it('exclude stories', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar', excludeStories: ['B', 'C'] };
          export const A = () => {};
          export const B = (args) => {};
          export const C = () => {};
        `
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
          excludeStories:
            - B
            - C
        stories:
          - id: foo-bar--a
            name: A
      `);
    });

    it('include stories', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar', includeStories: /^Include.*/ };
          export const SomeHelper = () => {};
          export const IncludeA = () => {};
        `
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
          includeStories: !<tag:yaml.org,2002:js/regexp> /^Include.*/
        stories:
          - id: foo-bar--include-a
            name: IncludeA
      `);
    });

    it('storyName annotation', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = () => {};
          A.storyName = 'Some story';
      `
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--a
            name: Some story
      `);
    });

    it('no meta', async () => {
      expect(
        await parse(
          dedent`
          export const A = () => {};
          export const B = () => {};
      `
        )
      ).toMatchInlineSnapshot(`
        meta: !<tag:yaml.org,2002:js/undefined> ''
        stories: []
      `);
    });

    it('typescript', async () => {
      expect(
        await parse(
          dedent`
          import { Meta, Story } from '@storybook/react';
          type PropTypes = {};
          export default { title: 'foo/bar/baz' } as Meta<PropTypes>;
          export const A: Story<PropTypes> = () => <>A</>;
          export const B: Story<PropTypes> = () => <>B</>;
        `
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar/baz
        stories:
          - id: foo-bar-baz--a
            name: A
          - id: foo-bar-baz--b
            name: B
      `);
    });

    it('template bind', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          const Template = (args) => { };
          export const A = Template.bind({});
          A.args = { x: 1 };
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--a
            name: A
            parameters:
              __isArgsStory: true
              __id: foo-bar--a
      `);
    });

    it('meta variable', async () => {
      expect(
        await parse(
          dedent`
          const meta = { title: 'foo/bar' };
          export default meta;
          export const A = () => {}
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--a
            name: A
            parameters:
              __isArgsStory: false
              __id: foo-bar--a
      `);
    });
  });
});
