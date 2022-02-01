import { html } from 'lit';
import { Meta, Story } from '@storybook/web-components';
import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

import './counter';
import type { Counter } from './counter';

export default {
  title: 'Addons/Interactions',
  component: 'sb-counter',
} as Meta;

const Template: Story<Counter> = () => html`<sb-counter></sb-counter>`;

export const Default = Template.bind({});

Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement.querySelector('sb-counter').shadowRoot);

  await userEvent.click(canvas.getByTestId('increment'));
  await userEvent.click(canvas.getByTestId('increment'));
  await userEvent.click(canvas.getByTestId('increment'));

  await expect(canvas.getByTestId('count').textContent).toEqual('You clicked 3 times');

  await userEvent.click(canvas.getByTestId('decrement'));

  await expect(canvas.getByTestId('count').textContent).toEqual('You clicked 2 times');
};
