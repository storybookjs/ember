/* eslint-disable no-underscore-dangle */
import path from 'path';
import { JsPackageManager } from '../../js-package-manager';
import { builderVite } from './builder-vite';

// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs-extra', () => require('../../../../../__mocks__/fs-extra'));

const checkBuilderVite = async ({ packageJson = {}, main }) => {
  // eslint-disable-next-line global-require
  require('fs-extra').__setMockFiles({
    [path.join('.storybook', 'main.js')]: `module.exports = ${JSON.stringify(main)};`,
  });
  const packageManager = {
    retrievePackageJson: () => ({ dependencies: {}, devDependencies: {}, ...packageJson }),
  } as JsPackageManager;
  return builderVite.check({ packageManager });
};

describe('builder-vite fix', () => {
  describe('storybook-builder-vite', () => {
    it('using storybook-builder-vite', async () => {
      const main = { core: { builder: 'storybook-builder-vite' } };
      await expect(checkBuilderVite({ main })).resolves.toMatchObject({
        builder: 'storybook-builder-vite',
      });
    });
    it('using storybook-builder-vite with options', async () => {
      const main = { core: { builder: { name: 'storybook-builder-vite', options: {} } } };
      await expect(checkBuilderVite({ main })).resolves.toMatchObject({
        builder: {
          name: 'storybook-builder-vite',
          options: {},
        },
      });
    });
  });
  describe('other builders', () => {
    it('using @storybook/builder-vite', async () => {
      const main = { core: { builder: { name: '@storybook/builder-vite', options: {} } } };
      await expect(checkBuilderVite({ main })).resolves.toBeFalsy();
    });
    it('using webpack5', async () => {
      const main = { core: { builder: 'webpack5' } };
      await expect(checkBuilderVite({ main })).resolves.toBeFalsy();
    });
    it('no builder specified', async () => {
      const main = {};
      await expect(checkBuilderVite({ main })).resolves.toBeFalsy();
    });
  });
});
