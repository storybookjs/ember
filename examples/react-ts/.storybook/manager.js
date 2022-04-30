import { addons } from '@storybook/addons';
import startCase from 'lodash/startCase';

addons.setConfig({
  sidebar: {
    renderLabel: ({ name, isLeaf }) => (isLeaf ? name : startCase(name)),
  },
});
