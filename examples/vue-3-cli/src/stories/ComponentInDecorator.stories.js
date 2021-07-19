import MyButton from './Button.vue';

export default {
  title: 'Example/ComponentInDecorator',
  component: MyButton,

  decorators: [
    () => ({
      components: {
        MyButton,
      },

      template: `
        <MyButton label="Button from decorator"/>
        <story/>
      `,
    }),
  ],
};

const Template = (args) => ({
  components: { MyButton },
  setup() {
    return { args };
  },
  template: '<my-button v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
};
