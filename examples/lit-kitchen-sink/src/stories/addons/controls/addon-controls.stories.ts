import { html } from 'lit';
import '../../../components/SbButton';

export default {
  title: 'Addons / Controls',
  argTypes: {
    backgroundColor: { control: 'color' },
    size: {
      control: {
        type: 'radio',
        options: ['small', 'medium', 'large'],
      },
    },
  },
};

const Template = ({ primary, backgroundColor, size, label, sbButtonClickHandler }: any) =>
  html`<sb-button
    ?primary="${primary}"
    .size="${size}"
    .label="${label}"
    .backgroundColor="${backgroundColor}"
    @sb-button:click="${sbButtonClickHandler}"
  ></sb-button>`;

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
  backgroundColor: '#ff00ff',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large Button',
  size: 'large',
};

export const ClickHandler = Template.bind({});
ClickHandler.args = {
  label: 'Click me to fire an alert!',
  sbButtonClickHandler: () => alert('Storybook Button clicked!'),
};
