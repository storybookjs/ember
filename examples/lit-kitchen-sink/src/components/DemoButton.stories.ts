import { html } from 'lit';
import { DemoButton } from './DemoButton';

export default {
  component: DemoButton,
  title: 'Examples / Button',
  argTypes: { onClick: { action: 'click ' } },
};

const Template = (args: any) => html`<demo-button ${args}></demo-button>`;

export const Default = Template.bind({});

export const WithLabel = Template.bind({});
// @ts-ignore
WithLabel.args = {
  label: 'Click Me!',
};

export const IsPrimary = Template.bind({});
// @ts-ignore
IsPrimary.args = {
  primary: true,
};
