/* eslint-disable no-underscore-dangle */
import dedent from 'ts-dedent';
import { JsPackageManager } from '../../js-package-manager';
import { eslintPlugin } from './eslint-plugin';

// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs-extra', () => require('../../../../../__mocks__/fs-extra'));

const checkEslint = async ({
  packageJson,
  main = {},
  hasEslint = true,
  eslintExtension = 'js',
}) => {
  // eslint-disable-next-line global-require
  require('fs-extra').__setMockFiles({
    '.storybook/main.js': !main ? null : `module.exports = ${JSON.stringify(main)};`,
    [`.eslintrc.${eslintExtension}`]: !hasEslint
      ? null
      : dedent(`
      module.exports = {
        extends: ['plugin:react/recommended', 'airbnb-typescript', 'plugin:prettier/recommended'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 12,
          sourceType: 'module',
          project: 'tsconfig.eslint.json',
        },
        plugins: ['react', '@typescript-eslint'],
        rules: {
          'some/rule': 'warn',
        },
      }
    `),
  });
  const packageManager = {
    retrievePackageJson: () => ({ dependencies: {}, devDependencies: {}, ...packageJson }),
  } as JsPackageManager;
  return eslintPlugin.check({ packageManager });
};

describe('eslint-plugin fix', () => {
  describe('should skip migration when', () => {
    it('project does not have eslint installed', async () => {
      const packageJson = { dependencies: {} };

      await expect(
        checkEslint({
          packageJson,
        })
      ).resolves.toBeFalsy();
    });

    it('project already contains eslint-plugin-storybook dependency', async () => {
      const packageJson = { dependencies: { 'eslint-plugin-storybook': '^0.0.0' } };

      await expect(
        checkEslint({
          packageJson,
        })
      ).resolves.toBeFalsy();
    });
  });

  describe('when project does not contain eslint-plugin-storybook but has eslint installed', () => {
    const packageJson = { dependencies: { '@storybook/react': '^6.2.0', eslint: '^7.0.0' } };

    describe('should no-op and warn when', () => {
      it('main.js is not found', async () => {
        const loggerSpy = jest.spyOn(console, 'warn').mockImplementationOnce(jest.fn);
        const result = await checkEslint({
          packageJson,
          main: null,
          hasEslint: false,
        });

        expect(loggerSpy).toHaveBeenCalledWith('Unable to find storybook main.js config, skipping');

        await expect(result).toBeFalsy();
      });

      it('.eslintrc is not found', async () => {
        const loggerSpy = jest.spyOn(console, 'warn').mockImplementationOnce(jest.fn);
        const result = await checkEslint({
          packageJson,
          hasEslint: false,
        });

        expect(loggerSpy).toHaveBeenCalledWith('Unable to find .eslintrc config file, skipping');

        await expect(result).toBeFalsy();
      });
    });

    describe('should install eslint plugin', () => {
      it('when .eslintrc is using a supported extension', async () => {
        await expect(
          checkEslint({
            packageJson,
          })
        ).resolves.toMatchObject({
          unsupportedExtension: undefined,
        });
      });

      it('when .eslintrc is using unsupported extension', async () => {
        await expect(
          checkEslint({
            packageJson,
            eslintExtension: 'yml',
          })
        ).resolves.toMatchObject({ unsupportedExtension: 'yml' });
      });
    });
  });
});
