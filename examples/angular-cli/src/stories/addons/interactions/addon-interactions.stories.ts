import { Story, Meta, moduleMetadata } from '@storybook/angular';
import { expect } from '@storybook/jest';
import { within, userEvent, waitFor } from '@storybook/testing-library';

import { HeroForm, HeroFormModule } from './hero-form/hero-form.component';

export default {
  title: 'Addons/Interactions',
  component: HeroForm,
  decorators: [
    moduleMetadata({
      imports: [HeroFormModule],
    }),
  ],
} as Meta<HeroForm>;

const Template: Story<HeroForm> = (args) => ({
  props: args,
});

export const Standard: Story<HeroForm> = Template.bind({});

export const InvalidFields: Story<HeroForm> = Template.bind({});
InvalidFields.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const heroName = canvas.getByRole('textbox', {
    name: /name/i,
  });
  await userEvent.type(heroName, 'Ororo Munroe');
  await userEvent.clear(heroName);
};

export const Submitted: Story<HeroForm> = Template.bind({});

Submitted.play = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const heroName = canvas.getByRole('textbox', {
    name: /name/i,
  });
  await userEvent.type(heroName, 'Ororo Munroe');

  const alterEgo = canvas.getByRole('textbox', {
    name: /alter ego/i,
  });
  await userEvent.type(alterEgo, 'Storm');

  const heroPower = canvas.getByRole('combobox', { name: /hero power/i });
  await userEvent.selectOptions(heroPower, 'Weather Changer');

  await userEvent.click(canvas.getByText('Submit'));

  await waitFor(async () => {
    await expect(
      canvas.getByRole('heading', {
        name: /you submitted the following:/i,
      })
    ).not.toBeNull();
  });
};
