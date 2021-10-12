import { AnyFramework, StoryAnnotationsOrFn } from '@storybook/csf';
import { normalizeStory } from './normalizeStory';

describe('normalizeStory', () => {
  describe('id generation', () => {
    it('combines title and export name', () => {
      expect(normalizeStory('name', {}, { title: 'title' }).id).toEqual('title--name');
    });

    it('respects component id', () => {
      expect(normalizeStory('name', {}, { title: 'title', id: 'component-id' }).id).toEqual(
        'component-id--name'
      );
    });

    it('respects parameters.__id', () => {
      expect(
        normalizeStory(
          'name',
          { parameters: { __id: 'story-id' } },
          { title: 'title', id: 'component-id' }
        ).id
      ).toEqual('story-id');
    });
  });

  describe('name', () => {
    it('preferences story.name over story.storyName', () => {
      expect(
        normalizeStory('export', { name: 'name', storyName: 'storyName' }, { title: 'title' }).name
      ).toEqual('name');
      expect(normalizeStory('export', { storyName: 'storyName' }, { title: 'title' }).name).toEqual(
        'storyName'
      );
    });

    it('falls back to capitalized export name', () => {
      expect(normalizeStory('exportOne', {}, { title: 'title' }).name).toEqual('Export One');
    });
  });

  describe('user-provided story function', () => {
    it('should normalize into an object', () => {
      const storyFn = () => {};
      const meta = { title: 'title' };
      expect(normalizeStory('storyExport', storyFn, meta)).toMatchInlineSnapshot(`
        Object {
          "argTypes": Object {},
          "args": Object {},
          "decorators": Array [],
          "id": "title--story-export",
          "loaders": Array [],
          "name": "Story Export",
          "parameters": Object {},
          "userStoryFn": [Function],
        }
      `);
    });
  });

  describe('user-provided story object', () => {
    describe('render function', () => {
      it('implicit render function', () => {
        const storyObj = {};
        const meta = { title: 'title' };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.render).toBeUndefined();
      });

      it('user-provided story render function', () => {
        const storyObj = { render: jest.fn() };
        const meta = { title: 'title', render: jest.fn() };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.render).toBe(storyObj.render);
      });

      it('user-provided meta render function', () => {
        const storyObj = {};
        const meta = { title: 'title', render: jest.fn() };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.render).toBeUndefined();
      });
    });

    describe('play function', () => {
      it('no render function', () => {
        const storyObj = {};
        const meta = { title: 'title' };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.play).toBeUndefined();
      });

      it('user-provided story render function', () => {
        const storyObj = { play: jest.fn() };
        const meta = { title: 'title', play: jest.fn() };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.play).toBe(storyObj.play);
      });

      it('user-provided meta render function', () => {
        const storyObj = {};
        const meta = { title: 'title', play: jest.fn() };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized.play).toBeUndefined();
      });
    });

    describe('annotations', () => {
      it('empty annotations', () => {
        const storyObj = {};
        const meta = { title: 'title' };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized).toMatchInlineSnapshot(`
          Object {
            "argTypes": Object {},
            "args": Object {},
            "decorators": Array [],
            "id": "title--story-export",
            "loaders": Array [],
            "name": "Story Export",
            "parameters": Object {},
          }
        `);
      });

      it('full annotations', () => {
        const storyObj: StoryAnnotationsOrFn<AnyFramework> = {
          name: 'story name',
          parameters: { storyParam: 'val' },
          decorators: [() => {}],
          loaders: [async () => ({})],
          args: { storyArg: 'val' },
          argTypes: { storyArgType: { type: 'string' } },
        };
        const meta = { title: 'title' };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized).toMatchInlineSnapshot(`
          Object {
            "argTypes": Object {
              "storyArgType": Object {
                "name": "storyArgType",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "storyArg": "val",
            },
            "decorators": Array [
              [Function],
            ],
            "id": "title--story-export",
            "loaders": Array [
              [Function],
            ],
            "name": "story name",
            "parameters": Object {
              "storyParam": "val",
            },
          }
        `);
      });

      it('prefers new annotations to legacy, but combines', () => {
        const storyObj: StoryAnnotationsOrFn<AnyFramework> = {
          name: 'story name',
          parameters: { storyParam: 'val' },
          decorators: [() => {}],
          loaders: [async () => ({})],
          args: { storyArg: 'val' },
          argTypes: { storyArgType: { type: 'string' } },
          story: {
            parameters: { storyParam2: 'legacy' },
            decorators: [() => {}],
            loaders: [async () => ({})],
            args: { storyArg2: 'legacy' },
            argTypes: { storyArgType2: { type: 'string' } },
          },
        };
        const meta = { title: 'title' };
        const normalized = normalizeStory('storyExport', storyObj, meta);
        expect(normalized).toMatchInlineSnapshot(`
          Object {
            "argTypes": Object {
              "storyArgType": Object {
                "name": "storyArgType",
                "type": Object {
                  "name": "string",
                },
              },
              "storyArgType2": Object {
                "name": "storyArgType2",
                "type": Object {
                  "name": "string",
                },
              },
            },
            "args": Object {
              "storyArg": "val",
              "storyArg2": "legacy",
            },
            "decorators": Array [
              [Function],
              [Function],
            ],
            "id": "title--story-export",
            "loaders": Array [
              [Function],
              [Function],
            ],
            "name": "story name",
            "parameters": Object {
              "storyParam": "val",
              "storyParam2": "legacy",
            },
          }
        `);
      });
    });
  });
});
