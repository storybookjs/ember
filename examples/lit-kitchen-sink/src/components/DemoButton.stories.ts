import { html } from 'lit';
import { DemoButton } from './DemoButton';

export default {
  component: DemoButton,
  title: 'Examples / Button',
  argTypes: { onClick: { action: 'click ' } },
};

const Template = ({ label, primary, value }: { label: string; primary: boolean; value: string }) =>
  html`<demo-button .label="${label}" ?primary="${primary}" .value="${value}"></demo-button>`;

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
