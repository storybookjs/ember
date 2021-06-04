import { html } from 'lit';
import { Story, Meta } from '@storybook/web-components';

export default {
  title: 'Addons / Backgrounds',
  parameters: {
    backgrounds: {
      default: 'twitter',
      values: [
        { name: 'twitter', value: '#00aced' },
        { name: 'facebook', value: '#3b5998' },
      ],
    },
  },
} as Meta;

const Template: Story = () => html`<button>Click Me!</button>`;

export const Default = Template.bind({});

export const Overridden = Template.bind({});
Overridden.parameters = {
  backgrounds: {
    default: 'pink',
    values: [
      { name: 'pink', value: 'hotpink' },
      { name: 'blue', value: 'deepskyblue' },
    ],
  },
};
