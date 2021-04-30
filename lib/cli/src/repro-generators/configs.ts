import { SupportedFrameworks } from '../project_types';

export interface Parameters {
  framework: SupportedFrameworks;
  /** E2E configuration name */
  name: string;
  /** framework version */
  version: string;
  /** CLI to bootstrap the project */
  generator: string;
  /** Use storybook framework detection */
  autoDetect?: boolean;
  /** Pre-build hook */
  preBuildCommand?: string;
  /** When cli complains when folder already exists */
  ensureDir?: boolean;
  /** Dependencies to add before building Storybook */
  additionalDeps?: string[];
  /** Add typescript dependency and creates a tsconfig.json file */
  typescript?: boolean;
}

const fromDeps = (...args: string[]): string =>
  [
    'cd {{appName}}-{{version}}',
    // Create `yarn.lock` to force Yarn to consider adding deps in this directory
    // and not look for a yarn workspace in parent directory
    'touch yarn.lock',
    'yarn init --yes',
    args.length && `yarn add ${args.join(' ')}`,
  ]
    .filter(Boolean)
    .join(' && ');

// #region  React
export const cra: Parameters = {
  framework: 'react',
  name: 'cra',
  version: 'latest',
  generator: [
    // Force npm otherwise we have a mess between Yarn 1 and Yarn 2
    'npx create-react-app@{{version}} {{appName}}-{{version}} --use-npm',
    'cd {{appName}}-{{version}}',
    'echo "FAST_REFRESH=true" > .env',
  ].join(' && '),
};

export const cra_typescript: Parameters = {
  framework: 'react',
  name: 'cra_typescript',
  version: 'latest',
  generator: [
    // Force npm otherwise we have a mess between Yarn 1 and Yarn 2
    'npx create-react-app@{{version}} {{appName}}-{{version}} --template typescript --use-npm',
  ].join(' && '),
};

export const react: Parameters = {
  framework: 'react',
  name: 'react',
  version: 'latest',
  generator: fromDeps('react', 'react-dom'),
};

export const react_typescript: Parameters = {
  framework: 'react',
  name: 'react_typescript',
  version: 'latest',
  generator: fromDeps('react', 'react-dom'),
  typescript: true,
};

export const webpack_react: Parameters = {
  framework: 'react',
  name: 'webpack_react',
  version: 'latest',
  generator: fromDeps('react', 'react-dom', 'webpack@webpack-4'),
};

export const react_in_yarn_workspace: Parameters = {
  framework: 'react',
  name: 'react_in_yarn_workspace',
  version: 'latest',
  generator: [
    'cd {{appName}}-{{version}}',
    'echo "{ \\"name\\": \\"workspace-root\\", \\"private\\": true, \\"workspaces\\": [] }" > package.json',
    'touch yarn.lock',
    `yarn add react react-dom`,
  ].join(' && '),
};

// #endregion

// #region Angular
const baseAngular: Parameters = {
  framework: 'angular',
  name: 'angular',
  version: 'latest',
  generator: [
    `npx --package @angular/cli@{{version}} ng new {{appName}}-{{version}} --routing=true --minimal=true --style=scss --skipInstall=true --strict`,
    `cd {{appName}}-{{version}}`,
  ].join(' && '),
};

export const angularv10: Parameters = {
  ...baseAngular,
  version: 'v10-lts',
};

export const angular: Parameters = baseAngular;
// #endregion

// #region  web components
export const web_components: Parameters = {
  framework: 'web-components',
  name: 'web_components',
  version: 'latest',
  generator: fromDeps('lit-element'),
};

export const web_components_typescript: Parameters = {
  framework: 'web-components',
  ...web_components,
  name: 'web_components_typescript',
  typescript: true,
};

// #endregion

// #region  vue

export const vue: Parameters = {
  framework: 'vue',
  name: 'vue',
  version: 'latest',
  generator: [
    `echo '{"useTaobaoRegistry": false}' > ~/.vuerc`,
    // Need to remove this file otherwise there is an issue when vue-cli is trying to install the dependency in the bootstrapped folder
    `rm package.json`,
    `npx -p @vue/cli@{{version}} vue create {{appName}}-{{version}} --default --packageManager=yarn --no-git --force`,
  ].join(' && '),
};

export const vue3: Parameters = {
  framework: 'vue3',
  name: 'vue3',
  version: 'next',
  // Vue CLI v4 utilizes webpack 4, and the 5-alpha uses webpack 5 so we force ^4 here
  generator: [
    `echo '{"useTaobaoRegistry": false}' > ~/.vuerc`,
    // Need to remove this file otherwise there is an issue when vue-cli is trying to install the dependency in the bootstrapped folder
    `rm package.json`,
    `npx -p @vue/cli@^4 vue create {{appName}}-{{version}} --preset=__default_vue_3__ --packageManager=yarn --no-git --force`,
  ].join(' && '),
};

// #endregion

export const html: Parameters = {
  framework: 'html',
  name: 'html',
  version: 'latest',
  generator: fromDeps(),
  autoDetect: false,
};

export const mithril: Parameters = {
  framework: 'mithril',
  name: 'mithril',
  version: 'latest',
  generator: fromDeps('mithril@{{version}}'),
};

export const preact: Parameters = {
  framework: 'preact',
  name: 'preact',
  version: 'latest',
  generator:
    'npx preact-cli@{{version}} create preactjs-templates/default {{appName}}-{{version}} --yarn --install=false --git=false',
  ensureDir: false,
};

export const rax: Parameters = {
  framework: 'rax',
  name: 'rax',
  version: 'latest',
  // Rax versions are inconsistent 1.1.0-1 for some
  generator: fromDeps('rax', 'rax-image', 'rax-link', 'rax-text', 'rax-view'),
};

export const sfcVue: Parameters = {
  framework: 'vue',
  name: 'sfcVue',
  version: 'latest',
  generator: fromDeps('vue', 'vue-loader', 'vue-template-compiler', 'webpack@webpack-4'),
};

export const svelte: Parameters = {
  framework: 'svelte',
  name: 'svelte',
  version: 'latest',
  generator: 'npx degit sveltejs/template {{appName}}-{{version}}',
};
