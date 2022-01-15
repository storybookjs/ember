/* eslint-disable no-underscore-dangle */
import path from 'path';
import { JsPackageManager } from '../../js-package-manager';
import { cra5 } from './cra5';

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
  return cra5.check({ packageManager });
};

describe('cra5 fix', () => {
  describe('sb < 6.3', () => {
    describe('cra5 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^6.2.0', 'react-scripts': '^5.0.0' },
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
    describe('no cra5 dependency', () => {
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
    describe('cra5 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^6.3.0', 'react-scripts': '^5.0.0' },
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
            craVersion: '^5.0.0',
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
            craVersion: '^5.0.0',
            storybookVersion: '^6.3.0',
          });
        });
      });
    });
    describe('no cra dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson: {},
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
    describe('cra4 dependency', () => {
      it('should no-op', async () => {
        await expect(
          checkCra5({
            packageJson: {
              dependencies: {
                'react-scripts': '4',
              },
            },
            main: {},
          })
        ).resolves.toBeFalsy();
      });
    });
  });
  describe('sb 7.0+', () => {
    describe('cra5 dependency', () => {
      const packageJson = {
        dependencies: { '@storybook/react': '^7.0.0-alpha.0', 'react-scripts': '^5.0.0' },
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
