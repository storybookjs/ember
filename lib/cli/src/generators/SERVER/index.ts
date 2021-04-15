import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const stories = ['../stories/**/*.stories.json'];

  baseGenerator(packageManager, npmOptions, options, 'server', {
    addComponents: false,
    extraMain: { stories },
  });
};

export default generator;
