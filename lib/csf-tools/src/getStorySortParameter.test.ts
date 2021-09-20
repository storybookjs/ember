import dedent from 'ts-dedent';
import { getStorySortParameter } from './getStorySortParameter';

describe('getStorySortParameter', () => {
  describe('supported', () => {
    it('no parameters', () => {
      expect(
        getStorySortParameter(dedent`
          export const decorators = [];
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
  });

  describe('unsupported', () => {
    it('invalid parameters', () => {
      expect(() =>
        getStorySortParameter(dedent`
          export const parameters = [];
        `)
      ).toThrowErrorMatchingInlineSnapshot(`
        "Unexpected 'parameters'. Parameter 'options.storySort' should be defined inline e.g.:

        export const parameters = {
          options: {
            storySort: <array | object | function>
          }
        }"
      `);
    });

    it('parameters var', () => {
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
      ).toBeUndefined();
    });

    it('options var', () => {
      expect(() =>
        getStorySortParameter(dedent`
          const options = {
            storySort: {
              method: "",
              order: [],
              locales: "",
            },
          };
          export const parameters = {
            options,
          };
      `)
      ).toThrowErrorMatchingInlineSnapshot(`
        "Unexpected 'options'. Parameter 'options.storySort' should be defined inline e.g.:

        export const parameters = {
          options: {
            storySort: <array | object | function>
          }
        }"
      `);
    });

    it('storySort var', () => {
      expect(() =>
        getStorySortParameter(dedent`
          const storySort = {
            method: "",
            order: [],
            locales: "",
          };
          export const parameters = {
            options: {
              storySort,
            },
          };
      `)
      ).toThrowErrorMatchingInlineSnapshot(`
        "Unexpected 'storySort'. Parameter 'options.storySort' should be defined inline e.g.:

        export const parameters = {
          options: {
            storySort: <array | object | function>
          }
        }"
      `);
    });
  });
});
