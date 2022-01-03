import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  return baseGenerator(packageManager, npmOptions, options, 'web-components', {
    extraPackages: ['lit-html'],
  });
};

export default generator;
