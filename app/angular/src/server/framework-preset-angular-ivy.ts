import { Configuration } from 'webpack';
import { process as ngccProcess } from '@angular/compiler-cli/ngcc';
import * as path from 'path';
import { Options } from './framework-preset-angular-cli';

/**
 * Run ngcc for converting modules to ivy format before starting storybook
 * This step is needed in order to support Ivy in storybook
 *
 * Information about Ivy can be found here https://angular.io/guide/ivy
 */
export const runNgcc = () => {
  ngccProcess({
    // should be async: true but does not work due to
    // https://github.com/storybookjs/storybook/pull/11157/files#r615413803
    async: false,
    basePath: path.join(process.cwd(), 'node_modules'), // absolute path to node_modules
    createNewEntryPointFormats: true, // --create-ivy-entry-points
    compileAllFormats: false, // --first-only
  });
};

export const webpack = async (webpackConfig: Configuration, options: Options) => {
  const angularOptions = await options.presets.apply(
    'angularOptions',
    {} as {
      enableIvy?: boolean;
    },
    options
  );

  // Default to true, if undefined
  if (angularOptions.enableIvy === false) {
    return webpackConfig;
  }

  runNgcc();

  return {
    ...webpackConfig,
    resolve: {
      ...webpackConfig.resolve,
      mainFields: [
        'es2015_ivy_ngcc',
        'module_ivy_ngcc',
        'main_ivy_ngcc',
        'es2015',
        'browser',
        'module',
        'main',
      ],
    },
  };
};
