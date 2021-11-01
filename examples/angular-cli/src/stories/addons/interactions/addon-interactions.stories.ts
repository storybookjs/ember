import { Story, Meta } from '@storybook/angular';
import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

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
