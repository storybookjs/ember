import fs from 'fs';
import path from 'path';
import {
  toRequireContext,
  StoriesEntry,
  normalizeStoriesEntry,
  NormalizedStoriesSpecifier,
} from '@storybook/core-common';
import registerRequireContextHook from '@storybook/babel-plugin-require-context-hook/register';
import global from 'global';
import { AnyFramework, ArgsEnhancer, ArgTypesEnhancer, DecoratorFunction } from '@storybook/csf';

import { ClientApi } from './Loader';
import { StoryshotsOptions } from '../api/StoryshotsOptions';

registerRequireContextHook();

const isFile = (file: string): boolean => {
  try {
    return fs.lstatSync(file).isFile();
  } catch (e) {
    return false;
  }
};

interface Output {
  features?: Record<string, boolean>;
  preview?: string;
  stories?: NormalizedStoriesSpecifier[];
  requireContexts?: string[];
}

const supportedExtensions = ['ts', 'tsx', 'js', 'jsx'];

const resolveFile = (configDir: string, supportedFilenames: string[]) =>
  supportedFilenames
    .flatMap((filename) =>
      supportedExtensions.map((ext) => path.join(configDir, `${filename}.${ext}`))
    )
    .find(isFile) || false;

export const getPreviewFile = (configDir: string): string | false =>
  resolveFile(configDir, ['preview', 'config']);

export const getMainFile = (configDir: string): string | false => resolveFile(configDir, ['main']);

function getConfigPathParts(input: string): Output {
  const configDir = path.resolve(input);

  if (fs.lstatSync(configDir).isDirectory()) {
    const output: Output = {};

    const preview = getPreviewFile(configDir);
    const main = getMainFile(configDir);

    if (preview) {
      output.preview = preview;
    }
    if (main) {
      const { stories = [], features = {} } = jest.requireActual(main);

      output.features = features;

      const workingDir = process.cwd();
      output.stories = stories.map((entry: StoriesEntry) => {
        const specifier = normalizeStoriesEntry(entry, {
          configDir,
          workingDir,
        });

        return specifier;
      });
      output.requireContexts = output.stories.map((specifier) => {
        const { path: basePath, recursive, match } = toRequireContext(specifier);

        // eslint-disable-next-line no-underscore-dangle
        return global.__requireContext(workingDir, basePath, recursive, match);
      });
    }

    return output;
  }

  return { preview: configDir };
}

function configure<TFramework extends AnyFramework>(
  options: {
    storybook: ClientApi<TFramework>;
  } & StoryshotsOptions
): void {
  const { configPath = '.storybook', config, storybook } = options;

  if (config && typeof config === 'function') {
    config(storybook);
    return;
  }

  const { preview, features = {}, stories = [], requireContexts = [] } = getConfigPathParts(
    configPath
  );

  global.FEATURES = features;
  global.STORIES = stories.map((specifier) => ({
    ...specifier,
    importPathMatcher: specifier.importPathMatcher.source,
  }));

  if (preview) {
    // This is essentially the same code as lib/core/src/server/preview/virtualModuleEntry.template
    const {
      parameters,
      decorators,
      globals,
      globalTypes,
      argsEnhancers,
      argTypesEnhancers,
    } = jest.requireActual(preview);

    if (decorators) {
      decorators.forEach((decorator: DecoratorFunction<TFramework>) =>
        storybook.addDecorator(decorator)
      );
    }
    if (parameters || globals || globalTypes) {
      storybook.addParameters({ ...parameters, globals, globalTypes });
    }
    if (argsEnhancers) {
      argsEnhancers.forEach((enhancer: ArgsEnhancer<TFramework>) =>
        storybook.addArgsEnhancer(enhancer as any)
      );
    }
    if (argTypesEnhancers) {
      argTypesEnhancers.forEach((enhancer: ArgTypesEnhancer<TFramework>) =>
        storybook.addArgTypesEnhancer(enhancer as any)
      );
    }
  }

  if (requireContexts && requireContexts.length) {
    storybook.configure(requireContexts, false, false);
  }
}

export default configure;
