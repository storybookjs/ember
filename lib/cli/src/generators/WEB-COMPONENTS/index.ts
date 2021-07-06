import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  return baseGenerator(packageManager, npmOptions, options, 'web-components');
};

export default generator;
