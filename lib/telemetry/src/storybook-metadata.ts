import readPkgUp from 'read-pkg-up';
import { detect, getNpmVersion } from 'detect-package-manager';
import {
  loadMainConfig,
  getStorybookInfo,
  getStorybookConfiguration,
  getProjectRoot,
} from '@storybook/core-common';
import type { StorybookConfig, PackageJson } from '@storybook/core-common';

import type { StorybookMetadata, Dependency, StorybookAddon } from './types';
import { getActualPackageVersion, getActualPackageVersions } from './package-versions';
import { getMonorepoType } from './get-monorepo-type';

let cachedMetadata: StorybookMetadata;
export const getStorybookMetadata = async (_configDir: string) => {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  const packageJson = readPkgUp.sync({ cwd: process.cwd() }).packageJson as PackageJson;
  const configDir =
    (_configDir ||
      (getStorybookConfiguration(packageJson.scripts.storybook, '-c', '--config-dir') as string)) ??
    '.storybook';
  const mainConfig = loadMainConfig({ configDir });
  cachedMetadata = await computeStorybookMetadata({ mainConfig, packageJson });
  return cachedMetadata;
};

export const metaFrameworks = {
  next: 'Next',
  'react-scripts': 'CRA',
  gatsby: 'Gatsby',
  '@nuxtjs/storybook': 'nuxt',
  '@nrwl/storybook': 'nx',
  '@vue/cli-service': 'vue-cli',
  '@sveltejs/kit': 'svelte-kit',
} as Record<string, string>;

// @TODO: This should be removed in 7.0 as the framework.options field in main.js will replace this
const getFrameworkOptions = (mainConfig: any) => {
  const possibleOptions = [
    'angular',
    'ember',
    'html',
    'preact',
    'react',
    'server',
    'svelte',
    'vue',
    'vue3',
    'webComponents',
  ].map((opt) => `${opt}Options`);

  // eslint-disable-next-line no-restricted-syntax
  for (const opt of possibleOptions) {
    if (opt in mainConfig) {
      return mainConfig[opt] as any;
    }
  }

  return undefined;
};

// Analyze a combination of information from main.js and package.json
// to provide telemetry over a Storybook project
export const computeStorybookMetadata = async ({
  packageJson,
  mainConfig,
}: {
  packageJson: PackageJson;
  mainConfig: StorybookConfig & Record<string, any>;
}): Promise<StorybookMetadata> => {
  const metadata: Partial<StorybookMetadata> = {
    generatedAt: new Date().getTime(),
    builder: { name: 'webpack4' },
    hasCustomBabel: false,
    hasCustomWebpack: false,
    hasStaticDirs: false,
    hasStorybookEslint: false,
    refCount: 0,
  };

  const allDependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
    ...packageJson?.peerDependencies,
  };

  const metaFramework = Object.keys(allDependencies).find((dep) => !!metaFrameworks[dep]);
  if (metaFramework) {
    const { version } = await getActualPackageVersion(metaFramework);
    metadata.metaFramework = {
      name: metaFrameworks[metaFramework],
      packageName: metaFramework,
      version,
    };
  }

  const monorepoType = getMonorepoType();
  if (monorepoType) {
    metadata.monorepo = monorepoType;
  }

  try {
    const packageManagerType = await detect({ cwd: getProjectRoot() });
    const packageManagerVerson = await getNpmVersion(packageManagerType);

    metadata.packageManager = {
      type: packageManagerType,
      version: packageManagerVerson,
    };
    // Better be safe than sorry, some codebases/paths might end up breaking with something like "spawn pnpm ENOENT"
    // so we just set the package manager if the detection is successful
    // eslint-disable-next-line no-empty
  } catch (err) {}

  metadata.hasCustomBabel = !!mainConfig.babel;
  metadata.hasCustomWebpack = !!mainConfig.webpackFinal;
  metadata.hasStaticDirs = !!mainConfig.staticDirs;

  if (mainConfig.typescript) {
    metadata.typescriptOptions = mainConfig.typescript;
  }

  if (mainConfig.core?.builder) {
    const { builder } = mainConfig.core;

    metadata.builder = {
      name: typeof builder === 'string' ? builder : builder.name,
      options: typeof builder === 'string' ? undefined : builder?.options ?? undefined,
    };
  }

  if (mainConfig.refs) {
    metadata.refCount = Object.keys(mainConfig.refs).length;
  }

  if (mainConfig.features) {
    metadata.features = mainConfig.features;
  }

  const addons: Record<string, StorybookAddon> = {};
  if (mainConfig.addons) {
    mainConfig.addons.forEach((addon) => {
      let result;
      let options;
      if (typeof addon === 'string') {
        result = addon.replace('/register', '');
      } else {
        options = addon.options;
        result = addon.name;
      }

      addons[result] = {
        options,
        version: undefined,
      };
    });
  }

  const addonVersions = await getActualPackageVersions(addons);
  addonVersions.forEach(({ name, version }) => {
    addons[name].version = version;
  });

  const addonNames = Object.keys(addons);

  // all Storybook deps minus the addons
  const storybookPackages = Object.keys(allDependencies)
    .filter((dep) => dep.includes('storybook') && !addonNames.includes(dep))
    .reduce((acc, dep) => {
      return {
        ...acc,
        [dep]: { version: undefined },
      };
    }, {}) as Record<string, Dependency>;

  const storybookPackageVersions = await getActualPackageVersions(storybookPackages);
  storybookPackageVersions.forEach(({ name, version }) => {
    storybookPackages[name].version = version;
  });

  const language = allDependencies.typescript ? 'typescript' : 'javascript';

  const hasStorybookEslint = !!allDependencies['eslint-plugin-storybook'];

  const storybookInfo = getStorybookInfo(packageJson);

  const storybookVersion =
    storybookPackages[storybookInfo.frameworkPackage]?.version || storybookInfo.version;

  return {
    ...metadata,
    storybookVersion,
    language,
    storybookPackages,
    framework: {
      name: storybookInfo.framework,
      options: getFrameworkOptions(mainConfig),
    },
    addons,
    hasStorybookEslint,
  };
};
