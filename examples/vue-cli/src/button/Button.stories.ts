import { Meta, Story } from '@storybook/vue/types-6-0';
import Button from './Button.vue';

export default {
  title: 'Button',
  component: Button,
  parameters: {
    controls: {
      expanded: true,
    },
  },
} as Meta;

export const ButtonWithProps: Story = (args, { argTypes }) => ({
  components: { Button },
  template: '<Button :size="size">Button text</Button>',
  props: Object.keys(argTypes),
});
ButtonWithProps.args = {
  size: 'big',
};
