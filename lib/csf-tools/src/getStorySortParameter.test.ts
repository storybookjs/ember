import dedent from 'ts-dedent';
import { getStorySortParameter } from './getStorySortParameter';

describe('getStorySortParameter', () => {
  it('no parameters', () => {
    expect(
      getStorySortParameter(dedent`
        export const decorators = [];
      `)
    ).toBeUndefined();
  });

  it('invalid parameters', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = [];
      `)
    ).toBeUndefined();
  });

  it('no storySort parameter', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          layout: 'fullscreen',
        };
      `)
    ).toBeUndefined();
  });

  it('with wildcards', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          options: {
            storySort: [
              "Intro",
              "Pages",
              ["Home", "Login", "Admin"],
              "Components",
              "*",
              "WIP",    
            ]
          }
        };
      `)
    ).toMatchInlineSnapshot(`
      Array [
        "Intro",
        "Pages",
        Array [
          "Home",
          "Login",
          "Admin",
        ],
        "Components",
        "*",
        "WIP",
      ]
    `);
  });

  it('arrow function', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          options: {
            storySort: (a, b) =>
              a[1].kind === b[1].kind
                ? 0
                : a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
          },
        };
      `)
    ).toMatchInlineSnapshot(`[Function]`);
  });

  it('function', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          options: {
            storySort: function sortStories(a, b) {
              return a[1].kind === b[1].kind
                ? 0
                : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
            },
          },
        };
      `)
    ).toMatchInlineSnapshot(`[Function]`);
  });

  it('empty sort', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          options: {
            storySort: {
              method: "",
              order: [],
              locales: "",
            },
          },
        };
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "locales": "",
        "method": "",
        "order": Array [],
      }
    `);
  });

  it('parameters typescript', () => {
    expect(
      getStorySortParameter(dedent`
        export const parameters = {
          options: {
            storySort: {
              method: "",
              order: [],
              locales: "",
            },
          },
        } as Parameters;
      `)
    ).toMatchInlineSnapshot(`
      Object {
        "locales": "",
        "method": "",
        "order": Array [],
      }
    `);
  });

  // unsupported
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('parameters var', () => {
    expect(
      getStorySortParameter(dedent`
        const parameters = {
          options: {
            storySort: {
              method: "",
              order: [],
              locales: "",
            },
          },
        };
        export { parameters };
      `)
    ).toMatchInlineSnapshot(`undefined`);
  });
});
