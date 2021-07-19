import { Meta, Story } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

import { SbButton } from './sb-button';

export default {
  title: 'Example/Button',
  // Need to set the tag to make addon-docs works properly with CustomElementsManifest
  component: 'sb-button',
  argTypes: {
    onClick: { action: 'onClick' },
  },
  parameters: {
    actions: {
      handles: ['click', 'sb-button:click'],
    },
  },
} as Meta;

const Template: Story<SbButton> = ({ primary, backgroundColor, size, label }) =>
  html`<sb-button
    ?primary="${primary}"
    size="${ifDefined(size)}"
    label="${ifDefined(label)}"
    background-color="${ifDefined(backgroundColor)}"
  ></sb-button>`;

export const Primary: Story<SbButton> = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
};

export const Secondary: Story<SbButton> = Template.bind({});
Secondary.args = {
  label: 'Button',
};

export const Large: Story<SbButton> = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Button',
};

export const Small: Story<SbButton> = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Button',
};
