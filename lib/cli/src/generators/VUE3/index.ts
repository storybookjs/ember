import { baseGenerator, Generator } from '../baseGenerator';
import { CoreBuilder } from '../../project_types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const updatedOptions = { ...options, builder: CoreBuilder.Webpack5 };

  baseGenerator(packageManager, npmOptions, updatedOptions, 'vue3', {
    extraPackages: ['vue-loader@^16.0.0'],
  });
};

export default generator;
