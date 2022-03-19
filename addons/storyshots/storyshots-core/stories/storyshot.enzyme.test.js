import path from 'path';
import { mount } from 'enzyme';
import initStoryshots from '../dist/ts3.9';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  renderer: mount,
});
