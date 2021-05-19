import { html } from 'lit';
import { Story, Meta } from '@storybook/lit';

export default {
  title: 'Examples / Button',
  argTypes: { onClick: { action: 'click ' } },
  parameters: {
    actions: {
      handles: ['click', 'sb-button:click'],
    },
  },
} as Meta;

const Template: Story = ({ primary, backgroundColor, size, label, sbButtonClickHandler }) =>
  html`<sb-button
    ?primary="${primary}"
    .size="${size}"
    .label="${label}"
    .backgroundColor="${backgroundColor}"
    @sb-button:click="${sbButtonClickHandler}"
  ></sb-button>`;

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Click Me!',
};

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
  backgroundColor: '#ff00ff',
  size: 'small',
};
