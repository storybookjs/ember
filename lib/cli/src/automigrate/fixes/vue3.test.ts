/* eslint-disable no-underscore-dangle */
import path from 'path';
import { JsPackageManager } from '../../js-package-manager';
import { vue3 } from './vue3';

// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs-extra', () => require('../../../../../__mocks__/fs-extra'));

const checkVue3 = async ({ packageJson, main }) => {
  // eslint-disable-next-line global-require
  require('fs-extra').__setMockFiles({
    [path.join('.storybook', 'main.js')]: `module.exports = ${JSON.stringify(main)};`,
  });
  const packageManager = {
    retrievePackageJson: () => ({ dependencies: {}, devDependencies: {}, ...packageJson }),
  } as JsPackageManager;
  return vue3.check({ packageManager });
};

describe('vue3 fix', () => {
  describe('sb < 6.3', () => {
    describe('vue3 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/vue': '^6.2.0', vue: '^3.0.0' },
      };
      it('should fail', async () => {
        await expect(
          checkVue3({
            packageJson,
            main: {},
          })
        ).rejects.toThrow();
      });
    });
    describe('no vue dependency', () => {
      const packageJson = { dependencies: { '@storybook/vue': '^6.2.0' } };
      it('should no-op', async () => {
        await expect(
          checkVue3({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 6.3 - 7.0', () => {
    describe('vue3 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/vue': '^6.3.0', vue: '^3.0.0' },
      };
      describe('webpack5 builder', () => {
        it('should no-op', async () => {
          await expect(
            checkVue3({
              packageJson,
              main: { core: { builder: 'webpack5' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('custom builder', () => {
        it('should no-op', async () => {
          await expect(
            checkVue3({
              packageJson,
              main: { core: { builder: 'storybook-builder-vite' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('webpack4 builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkVue3({
              packageJson,
              main: { core: { builder: 'webpack4' } },
            })
          ).resolves.toMatchObject({
            vueVersion: '^3.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
      describe('no builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkVue3({
              packageJson,
              main: {},
            })
          ).resolves.toMatchObject({
            vueVersion: '^3.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
    });
    describe('no vue dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkVue3({
            packageJson: {},
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
    describe('vue2 dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkVue3({
            packageJson: {
              dependencies: {
                vue: '2',
              },
            },
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 7.0+', () => {
    describe('vue3 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/vue': '^7.0.0-alpha.0', vue: '^3.0.0' },
      };
      it('should no-op', async () => {
        await expect(
          checkVue3({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
});
