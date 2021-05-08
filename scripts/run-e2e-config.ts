import { Parameters } from './run-e2e';

const baseAngular: Parameters = {
  framework: 'angular',
  name: 'angular',
  version: 'latest',
};

export const angularv10: Parameters = {
  ...baseAngular,
  // There is no `v10-lts` tag for now, to update as soon as one is published
  version: 'v10',
};

export const angular: Parameters = baseAngular;

// TODO: not working yet, help needed
// export const ember: Parameters = {
//   name: 'ember',
//   version: 'latest',
//   generator:
//     'npx ember-cli@{{version}} new {{name}}-{{version}} --skip-git --skip-npm --yarn --skip-bower',
//   preBuildCommand: 'ember build',
// };

export const html: Parameters = {
  framework: 'html',
  name: 'html',
  version: 'latest',
};

// TODO: need to install meteor first
// export const meteor: Parameters = {
//   name: 'meteor',
//   version: 'latest',
//   generator: 'meteor create {{name}}-{{version}} --minimal --react',
// };

export const preact: Parameters = {
  framework: 'preact',
  name: 'preact',
  version: 'latest',
  ensureDir: false,
};

export const react: Parameters = {
  framework: 'react',
  name: 'react',
  version: 'latest',
};

export const react_typescript: Parameters = {
  framework: 'react',
  name: 'react_typescript',
  version: 'latest',
};

// export const reactNative: Parameters = {
//   name: 'reactNative',
//   version: 'latest',
//   generator: 'npx expo-cli init {{name}}-{{version}} --template=bare-minimum --yarn',
// };

// TODO: issue in @storybook/cli init
export const cra: Parameters = {
  framework: 'react',
  name: 'cra',
  version: 'latest',
};

export const cra_typescript: Parameters = {
  framework: 'react',
  name: 'cra_typescript',
  version: 'latest',
};

export const sfcVue: Parameters = {
  framework: 'vue',
  name: 'sfcVue',
  version: 'latest',
};

export const svelte: Parameters = {
  framework: 'svelte',
  name: 'svelte',
  version: 'latest',
};

export const vue: Parameters = {
  framework: 'vue',
  name: 'vue',
  version: 'latest',
};

export const vue3: Parameters = {
  framework: 'vue3',
  name: 'vue3',
  version: 'next',
};

export const web_components: Parameters = {
  framework: 'web_components',
  name: 'web_components',
  version: 'latest',
};

export const web_components_typescript: Parameters = {
  ...web_components,
  name: 'web_components_typescript',
};

export const webpack_react: Parameters = {
  framework: 'react',
  name: 'webpack_react',
  version: 'latest',
};

export const react_in_yarn_workspace: Parameters = {
  framework: 'react',
  name: 'react_in_yarn_workspace',
  version: 'latest',
};

// View results at: https://datastudio.google.com/reporting/c34f64ee-400f-4d06-ad4f-5c2133e226da
export const cra_bench: Parameters = {
  name: 'cra_bench',
  version: 'latest',
  generator: [
    'npx create-react-app@{{version}} {{name}}-{{version}}',
    'cd {{name}}-{{version}}',
    // TODO: Move from `npx` to `yarn dlx`, it is not working out of the box
    // because of the fancy things done in `@storybook/bench` to investigate 🔎
    "npx @storybook/bench 'npx sb init' --label cra",
  ].join(' && '),
};
