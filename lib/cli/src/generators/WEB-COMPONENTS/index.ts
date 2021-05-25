import { baseGenerator, Generator } from '../baseGenerator';
import { copyTemplate } from '../../helpers';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'web-components');
  copyTemplate(__dirname, options.storyFormat);
};

export default generator;
