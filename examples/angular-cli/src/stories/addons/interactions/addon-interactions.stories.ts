/* eslint-disable storybook/use-storybook-testing-library */
// @TODO: use addon-interactions and remove the rule disable above
import { Story, Meta } from '@storybook/angular';
import { expect } from '@storybook/jest';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CounterComponent } from './counter/counter.component';

export default {
  title: 'Addons/Interactions',
  component: CounterComponent,
} as Meta;

const Template: Story = (args) => ({
  props: args,
});

export const Default: Story = Template.bind({});

Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByText('Increment'));

  const count = await canvas.findByTestId('count');
  await expect(count.textContent).toEqual('You clicked 1 times');
};
