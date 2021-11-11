import { linkTo } from '@storybook/addon-links';

import Welcome from '../Welcome.vue';

export default {
  title: 'Welcome',
  component: Welcome,
};

export const WelcomeStory = () => {
  return {
    render: (h) => h(Welcome, { listeners: { buttonRequested: linkTo('Button') } }),
  };
};
WelcomeStory.storyName = 'Welcome';
