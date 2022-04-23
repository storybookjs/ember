import fse from 'fs-extra';
import dedent from 'ts-dedent';
import { getStorybookBabelDependencies } from '@storybook/core-common';
import { NpmOptions } from '../NpmOptions';
import { SupportedLanguage, SupportedFrameworks, Builder, CoreBuilder } from '../project_types';
import { getBabelDependencies, copyComponents } from '../helpers';
import { configure } from './configure';
import { getPackageDetails, JsPackageManager } from '../js-package-manager';
import { generateStorybookBabelConfigInCWD } from '../babel-config';

export type GeneratorOptions = {
  language: SupportedLanguage;
  builder: Builder;
  linkable: boolean;
};

export interface FrameworkOptions {
  extraPackages?: string[];
  extraAddons?: string[];
  staticDir?: string;
  addScripts?: boolean;
  addComponents?: boolean;
  addBabel?: boolean;
  addESLint?: boolean;
  extraMain?: any;
  extensions?: string[];
  commonJs?: boolean;
}

export type Generator = (
  packageManager: JsPackageManager,
  npmOptions: NpmOptions,
  options: GeneratorOptions
) => Promise<void>;

const defaultOptions: FrameworkOptions = {
  extraPackages: [],
  extraAddons: [],
  staticDir: undefined,
  addScripts: true,
  addComponents: true,
  addBabel: true,
  addESLint: false,
  extraMain: undefined,
  extensions: undefined,
  commonJs: false,
};

const builderDependencies = (builder: Builder) => {
  switch (builder) {
    case CoreBuilder.Webpack4:
      return ['@storybook/builder-webpack4', '@storybook/manager-webpack4'];
    case CoreBuilder.Webpack5:
      return ['@storybook/builder-webpack5', '@storybook/manager-webpack5'];
    case CoreBuilder.Vite:
      return ['@storybook/builder-vite'];
    default:
      return [builder];
  }
};

const stripVersions = (addons: string[]) => addons.map((addon) => getPackageDetails(addon)[0]);

const hasInteractiveStories = (framework: SupportedFrameworks) =>
  ['react', 'angular', 'preact', 'svelte', 'vue3'].includes(framework);

export async function baseGenerator(
  packageManager: JsPackageManager,
  npmOptions: NpmOptions,
  { language, builder }: GeneratorOptions,
  framework: SupportedFrameworks,
  options: FrameworkOptions = defaultOptions
) {
  const {
    extraAddons,
    extraPackages,
    staticDir,
    addScripts,
    addComponents,
    addBabel,
    addESLint,
    extraMain,
    extensions,
  } = {
    ...defaultOptions,
    ...options,
  };

  // added to main.js
  // make sure to update `canUsePrebuiltManager` in dev-server.js and build-manager-config/main.js when this list changes
  const addons = ['@storybook/addon-links', '@storybook/addon-essentials'];
  // added to package.json
  const addonPackages = [...addons, '@storybook/addon-actions'];

  if (hasInteractiveStories(framework)) {
    addons.push('@storybook/addon-interactions');
    addonPackages.push('@storybook/addon-interactions', '@storybook/testing-library');
  }

  const yarn2Dependencies =
    packageManager.type === 'yarn2' ? ['@storybook/addon-docs', '@mdx-js/react@1.x.x'] : [];

  const files = await fse.readdir(process.cwd());
  const isNewFolder = !files.some(
    (fname) => fname.startsWith('.babel') || fname.startsWith('babel') || fname === 'package.json'
  );

  const packageJson = packageManager.retrievePackageJson();
  const installedDependencies = new Set(Object.keys(packageJson.dependencies));
  const frameworkPackage = `@storybook/${framework}`;

  const packages = [
    frameworkPackage,
    ...addonPackages,
    ...extraPackages,
    ...extraAddons,
    ...yarn2Dependencies,
    ...builderDependencies(builder),
  ]
    .filter(Boolean)
    .filter(
      (packageToInstall) => !installedDependencies.has(getPackageDetails(packageToInstall)[0])
    );

  const versionedPackages = await packageManager.getVersionedPackages(...packages);

  const coreBuilders = [CoreBuilder.Webpack4, CoreBuilder.Webpack5, CoreBuilder.Vite] as string[];
  const expandedBuilder = coreBuilders.includes(builder)
    ? `@storybook/builder-${builder}`
    : builder;
  const mainOptions =
    builder !== CoreBuilder.Webpack4
      ? {
          core: {
            builder: expandedBuilder,
          },
          ...extraMain,
        }
      : extraMain;

  // Default vite builder to storyStoreV7
  if (expandedBuilder === '@storybook/builder-vite') {
    mainOptions.features = {
      ...mainOptions.features,
      storyStoreV7: true,
    };
  }

  configure(framework, {
    framework: frameworkPackage,
    addons: [...addons, ...stripVersions(extraAddons)],
    extensions,
    commonJs: options.commonJs,
    ...mainOptions,
  });
  if (addComponents) {
    copyComponents(framework, language);
  }

  // FIXME: temporary workaround for https://github.com/storybookjs/storybook/issues/17516
  if (expandedBuilder === '@storybook/builder-vite') {
    const previewHead = dedent`
      <script>
        window.global = window;
      </script>
    `;
    await fse.writeFile(`.storybook/preview-head.html`, previewHead, { encoding: 'utf8' });
  }

  const babelDependencies = addBabel ? await getBabelDependencies(packageManager, packageJson) : [];
  if (isNewFolder) {
    babelDependencies.push(...getStorybookBabelDependencies());
    await generateStorybookBabelConfigInCWD();
  }
  packageManager.addDependencies({ ...npmOptions, packageJson }, [
    ...versionedPackages,
    ...babelDependencies,
  ]);

  if (addScripts) {
    packageManager.addStorybookCommandInScripts({
      port: 6006,
      staticFolder: staticDir,
    });
  }

  if (addESLint) {
    packageManager.addESLintConfig();
  }
}
