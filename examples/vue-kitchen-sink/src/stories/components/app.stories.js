import App from '../../App.vue';

export default {
  title: 'App',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => ({
  render: (h) => h(App),
});
Default.storyName = 'App';
