import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'vue', {
    extraPackages: ['vue-loader@^15.7.0'],
  });
};

export default generator;
