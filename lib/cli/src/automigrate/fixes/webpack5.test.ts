/* eslint-disable no-underscore-dangle */
import { JsPackageManager } from '../../js-package-manager';
import { webpack5 } from './webpack5';

// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs-extra', () => require('../../../../../__mocks__/fs-extra'));

const checkWebpack5 = async ({ packageJson, main }) => {
  // eslint-disable-next-line global-require
  require('fs-extra').__setMockFiles({
    '.storybook/main.js': `module.exports = ${JSON.stringify(main)};`,
  });
  const packageManager = {
    retrievePackageJson: () => ({ dependencies: {}, devDependencies: {}, ...packageJson }),
  } as JsPackageManager;
  return webpack5.check({ packageManager });
};

describe('webpack5 fix', () => {
  describe('sb < 6.3', () => {
    describe('webpack5 dependency', () => {
      const packageJson = { dependencies: { '@storybook/react': '^6.2.0', webpack: '^5.0.0' } };
      it('should fail', async () => {
        await expect(
          checkWebpack5({
            packageJson,
            main: {},
          })
        ).rejects.toThrow();
      });
    });
    describe('no webpack5 dependency', () => {
      const packageJson = { dependencies: { '@storybook/react': '^6.2.0' } };
      it('should no-op', async () => {
        await expect(
          checkWebpack5({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 6.3 - 7.0', () => {
    describe('webpack5 dependency', () => {
      const packageJson = { dependencies: { '@storybook/react': '^6.3.0', webpack: '^5.0.0' } };
      describe('webpack5 builder', () => {
        it('should no-op', async () => {
          await expect(
            checkWebpack5({
              packageJson,
              main: { core: { builder: 'webpack5' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('custom builder', () => {
        it('should no-op', async () => {
          await expect(
            checkWebpack5({
              packageJson,
              main: { core: { builder: 'storybook-builder-vite' } },
            })
          ).resolves.toBeFalsy();
        });
      });
      describe('webpack4 builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkWebpack5({
              packageJson,
              main: { core: { builder: 'webpack4' } },
            })
          ).resolves.toMatchObject({
            webpackVersion: '^5.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
      describe('no builder', () => {
        it('should add webpack5 builder', async () => {
          await expect(
            checkWebpack5({
              packageJson,
              main: {},
            })
          ).resolves.toMatchObject({
            webpackVersion: '^5.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
    });
    describe('no webpack dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkWebpack5({
            packageJson: {},
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
    describe('webpack4 dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkWebpack5({
            packageJson: {
              dependencies: {
                webpack: '4',
              },
            },
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 7.0+', () => {
    describe('webpack5 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^7.0.0-alpha.0', webpack: '^5.0.0' },
      };
      it('should no-op', async () => {
        await expect(
          checkWebpack5({
            packageJson,
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
});
