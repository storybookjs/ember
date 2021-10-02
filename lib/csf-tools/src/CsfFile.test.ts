/* eslint-disable no-underscore-dangle */
import dedent from 'ts-dedent';
import yaml from 'js-yaml';
import { loadCsf } from './CsfFile';

// @ts-ignore
expect.addSnapshotSerializer({
  print: (val: any) => yaml.dump(val).trimEnd(),
  test: (val) => typeof val !== 'string',
});

const parse = async (code: string, includeParameters?: boolean) => {
  const { stories, meta } = loadCsf(code, { defaultTitle: 'Default Title' }).parse();
  const filtered = includeParameters
    ? stories
    : stories.map(({ id, name, parameters, ...rest }) => ({ id, name, ...rest }));
  return { meta, stories: filtered };
};

describe('CsfFile', () => {
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

    it('underscores', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const __Basic__ = () => {};
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--basic
            name: Basic
            parameters:
              __isArgsStory: false
              __id: foo-bar--basic
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
            name: Include A
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

    it('no title', async () => {
      expect(
        await parse(
          dedent`
          export default { component: 'foo' }
          export const A = () => {};
          export const B = () => {};
      `
        )
      ).toMatchInlineSnapshot(`
        meta:
          component: foo
          title: Default Title
        stories:
          - id: default-title--a
            name: A
          - id: default-title--b
            name: B
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

    it('docs-only story', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const __page = () => {};
          __page.parameters = { docsOnly: true };
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--page
            name: Page
            parameters:
              __isArgsStory: false
              __id: foo-bar--page
              docsOnly: true
      `);
    });
  });

  // NOTE: this does not have a public API, but we can still test it
  describe('indexed annotations', () => {
    it('meta annotations', () => {
      const input = dedent`
        export default { title: 'foo/bar', x: 1, y: 2 };
      `;
      const csf = loadCsf(input, { defaultTitle: 'Default Title' }).parse();
      expect(Object.keys(csf._metaAnnotations)).toEqual(['title', 'x', 'y']);
    });

    it('story annotations', () => {
      const input = dedent`
        export default { title: 'foo/bar' };
        export const A = () => {};
        A.x = 1;
        A.y = 2;
        export const B = () => {};
        B.z = 3;
    `;
      const csf = loadCsf(input, { defaultTitle: 'Default Title' }).parse();
      expect(Object.keys(csf._storyAnnotations.A)).toEqual(['x', 'y']);
      expect(Object.keys(csf._storyAnnotations.B)).toEqual(['z']);
    });

    it('v1-style story annotations', () => {
      const input = dedent`
        export default { title: 'foo/bar' };
        export const A = () => {};
        A.story = {
          x: 1,
          y: 2,
        }
        export const B = () => {};
        B.story = {
          z: 3,
        }
    `;
      const csf = loadCsf(input, { defaultTitle: 'Default Title' }).parse();
      expect(Object.keys(csf._storyAnnotations.A)).toEqual(['x', 'y']);
      expect(Object.keys(csf._storyAnnotations.B)).toEqual(['z']);
    });
  });

  describe('CSF3', () => {
    it('Object export with no-args render', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = {
            render: () => {}
          }
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

    it('Object export with args render', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = {
            render: (args) => {}
          }
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

    it('Object export with default render', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = {}
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

    it('Object export with name', async () => {
      expect(
        await parse(
          dedent`
          export default { title: 'foo/bar' };
          export const A = {
            name: 'Apple'
          }
        `,
          true
        )
      ).toMatchInlineSnapshot(`
        meta:
          title: foo/bar
        stories:
          - id: foo-bar--a
            name: Apple
            parameters:
              __isArgsStory: true
              __id: foo-bar--a
      `);
    });
  });
});
