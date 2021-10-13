import { Story, Meta } from '@storybook/angular';
// import { expect } from '@storybook/jest';
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
  // TODO: Testing library does NOT support shadow dom. This will not work.
  // We can try this instead: https://www.npmjs.com/package/testing-library__dom but it's in beta and hasn't been updated in 8 months
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByText('Increment'));

  // const count = await canvas.findByTestId('count');
  // await expect(count.textContent).toEqual('1');
};
