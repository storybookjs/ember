/* eslint-disable no-underscore-dangle */
import path from 'path';
import { JsPackageManager } from '../../js-package-manager';
import { angular12 } from './angular12';

// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs-extra', () => require('../../../../../__mocks__/fs-extra'));

const checkCra5 = async ({ packageJson, main }) => {
  // eslint-disable-next-line global-require
  require('fs-extra').__setMockFiles({
    [path.join('.storybook', 'main.js')]: `module.exports = ${JSON.stringify(main)};`,
  });
  const packageManager = {
    retrievePackageJson: () => ({ dependencies: {}, devDependencies: {}, ...packageJson }),
  } as JsPackageManager;
  return angular12.check({ packageManager });
};

describe('angular12 fix', () => {
  describe('sb < 6.3', () => {
    describe('angular12 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^6.2.0', '@angular/core': '^12.0.0' },
      };
      it('should fail', async () => {
        await expect(
          checkCra5({
            packageJson,
            main: {},
          })
        ).rejects.toThrow();
      });
    });
    describe('no angular dependency', () => {
      const packageJson = { dependencies: { '@storybook/react': '^6.2.0' } };
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 6.3 - 7.0', () => {
    describe('angular12 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^6.3.0', '@angular/core': '^12.0.0' },
      };
      describe('webpack5 builder', () => {
        it('should no-op', async () => {
          await expect(
            checkCra5({
              packageJson,
              main: { core: { builder: 'webpack5' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('custom builder', () => {
        it('should no-op', async () => {
          await expect(
            checkCra5({
              packageJson,
              main: { core: { builder: 'storybook-builder-vite' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('webpack4 builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkCra5({
              packageJson,
              main: { core: { builder: 'webpack4' } },
            })
          ).resolves.toMatchObject({
            angularVersion: '^12.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
      describe('no builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkCra5({
              packageJson,
              main: {},
            })
          ).resolves.toMatchObject({
            angularVersion: '^12.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
    });
    describe('no angular dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson: {},
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
    describe('angular11 dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson: {
              dependencies: {
                '@angular/core': '11',
              },
            },
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 7.0+', () => {
    describe('angular12 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^7.0.0-alpha.0', '@angular/core': '^12.0.0' },
      };
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
});
