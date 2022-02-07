import dedent from 'ts-dedent';
import { formatConfig, loadConfig } from './ConfigFile';

expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => true,
});

const getField = (path: string[], source: string) => {
  const config = loadConfig(source).parse();
  return config.getFieldValue(path);
};

const setField = (path: string[], value: any, source: string) => {
  const config = loadConfig(source).parse();
  config.setFieldValue(path, value);
  return formatConfig(config);
};

describe('ConfigFile', () => {
  describe('getField', () => {
    describe('named exports', () => {
      it('missing export', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            export const foo = { builder: 'webpack5' }
            `
          )
        ).toBeUndefined();
      });
      it('missing field', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            export const core = { foo: 'webpack5' }
            `
          )
        ).toBeUndefined();
      });
      it('found scalar', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            export const core = { builder: 'webpack5' }
            `
          )
        ).toEqual('webpack5');
      });
      it('found object', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            export const core = { builder: { name: 'webpack5' } }
            `
          )
        ).toEqual({ name: 'webpack5' });
      });
      it('variable ref export', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            const coreVar = { builder: 'webpack5' };
            export const core = coreVar;
            `
          )
        ).toEqual('webpack5');
      });
      it('variable export', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            const coreVar = { builder: 'webpack5' };
            export const core = coreVar;
            `
          )
        ).toEqual('webpack5');
      });
    });
    describe('module exports', () => {
      it('missing export', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            module.exports = { foo: { builder: 'webpack5' } }
            `
          )
        ).toBeUndefined();
      });
      it('found scalar', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            module.exports = { core: { builder: 'webpack5' } }
            `
          )
        ).toEqual('webpack5');
      });
      it('variable ref export', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            const core = { builder: 'webpack5' };
            module.exports = { core };
            `
          )
        ).toEqual('webpack5');
      });
      it('variable rename', () => {
        expect(
          getField(
            ['core', 'builder'],
            dedent`
            const coreVar = { builder: 'webpack5' };
            module.exports = { core: coreVar };
            `
          )
        ).toEqual('webpack5');
      });
      it('variable exports', () => {
        expect(
          getField(
            ['stories'],
            dedent`
              import type { StorybookConfig } from '@storybook/react/types';

              const config: StorybookConfig = {
                stories: [{ directory: '../src', titlePrefix: 'Demo' }],
              }
              module.exports = config;
            `
          )
        ).toEqual([{ directory: '../src', titlePrefix: 'Demo' }]);
      });
    });
  });

  describe('setField', () => {
    describe('named exports', () => {
      it('missing export', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              export const addons = [];
            `
          )
        ).toMatchInlineSnapshot(`
          export const addons = [];
          export const core = {
            builder: "webpack5"
          };
        `);
      });
      it('missing field', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              export const core = { foo: 'bar' };
            `
          )
        ).toMatchInlineSnapshot(`
          export const core = {
            foo: 'bar',
            builder: "webpack5"
          };
        `);
      });
      it('found scalar', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              export const core = { builder: 'webpack4' };
            `
          )
        ).toMatchInlineSnapshot(`
          export const core = {
            builder: "webpack5"
          };
        `);
      });
      it('found object', () => {
        expect(
          setField(
            ['core', 'builder'],
            { name: 'webpack5' },
            dedent`
              export const core = { builder: { name: 'webpack4' } };
            `
          )
        ).toMatchInlineSnapshot(`
          export const core = {
            builder: {
              "name": "webpack5"
            }
          };
        `);
      });
      it('variable export', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
            const coreVar = { builder: 'webpack4' };
            export const core = coreVar;
            `
          )
        ).toMatchInlineSnapshot(`
          const coreVar = {
            builder: "webpack5"
          };
          export const core = coreVar;
        `);
      });
    });
    describe('module exports', () => {
      it('missing export', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              module.exports = { addons: [] };
            `
          )
        ).toMatchInlineSnapshot(`
          module.exports = {
            addons: [],
            core: {
              builder: "webpack5"
            }
          };
        `);
      });
      it('missing field', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              module.exports = { core: { foo: 'bar' }};
            `
          )
        ).toMatchInlineSnapshot(`
          module.exports = {
            core: {
              foo: 'bar',
              builder: "webpack5"
            }
          };
        `);
      });
      it('found scalar', () => {
        expect(
          setField(
            ['core', 'builder'],
            'webpack5',
            dedent`
              module.exports = { core: { builder: 'webpack4' } };
            `
          )
        ).toMatchInlineSnapshot(`
          module.exports = {
            core: {
              builder: "webpack5"
            }
          };
        `);
      });
    });
  });
});
