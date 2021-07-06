import { normalizeV2, normalizeV3 } from './normalizeStory';

const globalRender = 'global-render';

describe('normalizeStory', () => {
  describe('user-provided story function', () => {
    describe('v2', () => {
      it('should normalize into an object', () => {
        const storyFn = () => {};
        const meta = { title: 'title' };
        expect(normalizeV2('storyExport', storyFn, meta, globalRender)).toMatchInlineSnapshot(`
          Object {
            "name": "Story Export",
            "parameters": Object {
              "__id": "title--story-export",
              "argTypes": Object {},
              "args": Object {},
              "decorators": Array [],
              "loaders": Array [],
            },
            "storyFn": [Function],
          }
        `);
      });
    });
    describe('v3', () => {
      it('should normalize into an object', () => {
        const storyFn = () => {};
        const meta = { title: 'title' };
        expect(normalizeV3('storyExport', storyFn, meta, globalRender)).toMatchInlineSnapshot(`
          Object {
            "name": "Story Export",
            "parameters": Object {
              "__id": "title--story-export",
              "argTypes": Object {},
              "args": Object {},
              "decorators": Array [],
              "loaders": Array [],
              "play": undefined,
            },
            "storyFn": [Function],
          }
        `);
      });
      it('should throw on story annotation', async () => {
        const storyFn = () => {};
        storyFn.story = { name: 'v1 style name' };
        const meta = { title: 'title' };
        await expect(async () =>
          normalizeV3('storyExport', storyFn, meta, globalRender)
        ).rejects.toThrow();
      });
    });
  });
  describe('user-provided story object', () => {
    describe('v2', () => {
      it('should treat it the same as if it was a function', () => {
        const storyObj = {};
        const meta = { title: 'title' };
        expect(normalizeV2('storyExport', storyObj, meta, globalRender)).toMatchInlineSnapshot(`
          Object {
            "name": "Story Export",
            "parameters": Object {
              "__id": "title--story-export",
              "argTypes": Object {},
              "args": Object {},
              "decorators": Array [],
              "loaders": Array [],
            },
            "storyFn": Object {},
          }
        `);
      });
    });
    describe('v3', () => {
      describe('render function', () => {
        it('implicit render function', () => {
          const storyObj = {};
          const meta = { title: 'title' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.storyFn).toBe(globalRender);
        });

        it('user-provided story render function', () => {
          const storyObj = { render: () => 'story' };
          const meta = { title: 'title', render: () => 'meta' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.storyFn).toBe(storyObj.render);
        });

        it('user-provided meta render function', () => {
          const storyObj = {};
          const meta = { title: 'title', render: () => 'meta' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.storyFn).toBe(meta.render);
        });
      });

      describe('play function', () => {
        it('no render function', () => {
          const storyObj = {};
          const meta = { title: 'title' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.parameters.play).toBeUndefined();
        });

        it('user-provided story render function', () => {
          const storyObj = { play: () => 'story' };
          const meta = { title: 'title', play: () => 'meta' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.parameters.play).toBe(storyObj.play);
        });

        it('user-provided meta render function', () => {
          const storyObj = {};
          const meta = { title: 'title', play: () => 'meta' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized.parameters.play).toBe(meta.play);
        });
      });

      describe('annotations', () => {
        it('empty annotations', () => {
          const storyObj = {};
          const meta = { title: 'title' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized).toMatchInlineSnapshot(`
            Object {
              "name": "Story Export",
              "parameters": Object {
                "__id": "title--story-export",
                "argTypes": Object {},
                "args": Object {},
                "decorators": Array [],
                "loaders": Array [],
                "play": undefined,
              },
              "storyFn": "global-render",
            }
          `);
        });

        it('full annotations', () => {
          const storyObj = {
            name: 'story name',
            parameters: { storyParam: 'val' },
            decorators: [() => {}],
            loaders: [() => {}],
            args: { storyArg: 'val' },
            argTypes: { storyArgType: 'val' },
          };
          const meta = { title: 'title' };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized).toMatchInlineSnapshot(`
            Object {
              "name": "story name",
              "parameters": Object {
                "__id": "title--story-export",
                "argTypes": Object {
                  "storyArgType": "val",
                },
                "args": Object {
                  "storyArg": "val",
                },
                "decorators": Array [
                  [Function],
                ],
                "loaders": Array [
                  [Function],
                ],
                "play": undefined,
                "storyParam": "val",
              },
              "storyFn": "global-render",
            }
          `);
        });

        it('meta annotations', () => {
          const storyObj = {};
          const meta = {
            title: 'title',
            parameters: { metaParam: 'val' },
            decorators: [() => {}],
            loaders: [() => {}],
            args: { metaArg: 'val' },
            argTypes: { metaArgType: 'val' },
          };
          const normalized = normalizeV3('storyExport', storyObj, meta, globalRender);
          expect(normalized).toMatchInlineSnapshot(`
            Object {
              "name": "Story Export",
              "parameters": Object {
                "__id": "title--story-export",
                "argTypes": Object {},
                "args": Object {},
                "decorators": Array [],
                "loaders": Array [],
                "play": undefined,
              },
              "storyFn": "global-render",
            }
          `);
        });
      });
    });
  });
});
