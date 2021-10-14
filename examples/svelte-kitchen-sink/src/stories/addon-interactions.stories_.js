import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

import Counter from '../components/Counter.svelte';

export default {
  title: 'Addon/Interactions',
};

const Template = (args) => ({
  Component: Counter,
  props: args,
});

export const Default = Template.bind({});

Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByText('Increment'));

  const count = await canvas.findByTestId('count');
  await expect(count.textContent).toEqual('You clicked 1 times');
};
