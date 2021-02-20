import fse from 'fs-extra';
import { baseGenerator, Generator } from '../baseGenerator';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const prefix = fse.existsSync('./src') ? '../src' : '../stories';
  const stories = [`${prefix}/**/*.stories.json`];

  baseGenerator(packageManager, npmOptions, options, 'server', {
    addComponents: false,
    configureOptions: { stories },
  });
};

export default generator;
