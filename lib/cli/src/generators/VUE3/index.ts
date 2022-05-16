import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'vue3', {
    extraPackages: ['vue-loader@^16.0.0'],
  });
};

export default generator;
