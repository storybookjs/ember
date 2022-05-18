import path from 'path';
import fs from 'fs';
import findUp from 'find-up';

import {
  ProjectType,
  supportedTemplates,
  SUPPORTED_FRAMEWORKS,
  SupportedLanguage,
  TemplateConfiguration,
  TemplateMatcher,
  unsupportedTemplate,
  CoreBuilder,
} from './project_types';
import { getBowerJson, paddedLog } from './helpers';
import { PackageJson, readPackageJson, JsPackageManager } from './js-package-manager';
import { detectWebpack } from './detect-webpack';
import { detectNextJS } from './detect-nextjs';

const viteConfigFiles = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];

const hasDependency = (
  packageJson: PackageJson,
  name: string,
  matcher?: (version: string) => boolean
) => {
  const version = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name];
  if (version && typeof matcher === 'function') {
    return matcher(version);
  }
  return !!version;
};

const hasPeerDependency = (
  packageJson: PackageJson,
  name: string,
  matcher?: (version: string) => boolean
) => {
  const version = packageJson.peerDependencies?.[name];
  if (version && typeof matcher === 'function') {
    return matcher(version);
  }
  return !!version;
};

type SearchTuple = [string, (version: string) => boolean | undefined];

const getFrameworkPreset = (
  packageJson: PackageJson,
  framework: TemplateConfiguration
): ProjectType | null => {
  const matcher: TemplateMatcher = {
    dependencies: [false],
    peerDependencies: [false],
    files: [false],
  };

  const { preset, files, dependencies, peerDependencies, matcherFunction } = framework;

  let dependencySearches = [] as SearchTuple[];
  if (Array.isArray(dependencies)) {
    dependencySearches = dependencies.map((name) => [name, undefined]);
  } else if (typeof dependencies === 'object') {
    dependencySearches = Object.entries(dependencies);
  }

  // Must check the length so the `[false]` isn't overwritten if `{ dependencies: [] }`
  if (dependencySearches.length > 0) {
    matcher.dependencies = dependencySearches.map(([name, matchFn]) =>
      hasDependency(packageJson, name, matchFn)
    );
  }

  let peerDependencySearches = [] as SearchTuple[];
  if (Array.isArray(peerDependencies)) {
    peerDependencySearches = peerDependencies.map((name) => [name, undefined]);
  } else if (typeof peerDependencies === 'object') {
    peerDependencySearches = Object.entries(peerDependencies);
  }

  // Must check the length so the `[false]` isn't overwritten if `{ peerDependencies: [] }`
  if (peerDependencySearches.length > 0) {
    matcher.peerDependencies = peerDependencySearches.map(([name, matchFn]) =>
      hasPeerDependency(packageJson, name, matchFn)
    );
  }

  if (Array.isArray(files) && files.length > 0) {
    matcher.files = files.map((name) => fs.existsSync(path.join(process.cwd(), name)));
  }

  return matcherFunction(matcher) ? preset : null;
};

export function detectFrameworkPreset(packageJson = {} as PackageJson) {
  const result = [...supportedTemplates, unsupportedTemplate].find((framework) => {
    return getFrameworkPreset(packageJson, framework) !== null;
  });

  return result ? result.preset : ProjectType.UNDETECTED;
}

/**
 * Attempts to detect which builder to use, by searching for a vite config file.  If one is found, the vite builder
 * will be used, otherwise, webpack4 is the default.
 *
 * @returns CoreBuilder
 */
export function detectBuilder(packageManager: JsPackageManager) {
  const viteConfig = findUp.sync(viteConfigFiles);

  if (viteConfig) {
    paddedLog('Detected vite project, setting builder to @storybook/builder-vite');
    return CoreBuilder.Vite;
  }

  const nextJSVersion = detectNextJS(packageManager);
  if (nextJSVersion) {
    if (nextJSVersion >= 11) {
      return CoreBuilder.Webpack5;
    }
  }

  const webpackVersion = detectWebpack(packageManager);
  if (webpackVersion) {
    if (webpackVersion <= 4) {
      return CoreBuilder.Webpack4;
    }
    if (webpackVersion >= 5) {
      return CoreBuilder.Webpack5;
    }
  }

  // Fallback to webpack4
  return CoreBuilder.Webpack4;
}

export function isStorybookInstalled(dependencies: PackageJson | false, force?: boolean) {
  if (!dependencies) {
    return false;
  }

  if (!force && dependencies.devDependencies) {
    if (
      SUPPORTED_FRAMEWORKS.reduce(
        (storybookPresent, framework) =>
          storybookPresent || !!dependencies.devDependencies[`@storybook/${framework}`],
        false
      )
    ) {
      return ProjectType.ALREADY_HAS_STORYBOOK;
    }

    if (
      dependencies.devDependencies['@kadira/storybook'] ||
      dependencies.devDependencies['@kadira/react-native-storybook']
    ) {
      return ProjectType.UPDATE_PACKAGE_ORGANIZATIONS;
    }
  }
  return false;
}

export function detectLanguage() {
  let language = SupportedLanguage.JAVASCRIPT;
  let packageJson;
  try {
    packageJson = readPackageJson();
  } catch (err) {
    //
  }
  const bowerJson = getBowerJson();
  if (!packageJson && !bowerJson) {
    return language;
  }

  if (hasDependency(packageJson || bowerJson, 'typescript')) {
    language = SupportedLanguage.TYPESCRIPT;
  }

  return language;
}

export function detect(options: { force?: boolean; html?: boolean } = {}) {
  let packageJson;
  try {
    packageJson = readPackageJson();
  } catch (err) {
    //
  }
  const bowerJson = getBowerJson();

  if (!packageJson && !bowerJson) {
    return ProjectType.UNDETECTED;
  }

  const storyBookInstalled = isStorybookInstalled(packageJson, options.force);
  if (storyBookInstalled) {
    return storyBookInstalled;
  }

  if (options.html) {
    return ProjectType.HTML;
  }

  return detectFrameworkPreset(packageJson || bowerJson);
}
