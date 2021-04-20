import { baseGenerator, Generator } from '../baseGenerator';
import { copyTemplate, storiesPath } from '../../helpers';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const stories = [`${storiesPath()}/**/*.stories.json`];

  baseGenerator(packageManager, npmOptions, options, 'server', {
    extraMain: { stories },
  });

  copyTemplate(__dirname, options.storyFormat);
};

export default generator;
