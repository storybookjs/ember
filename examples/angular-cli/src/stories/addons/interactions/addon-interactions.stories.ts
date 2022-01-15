import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Story, Meta, moduleMetadata } from '@storybook/angular';
import { expect } from '@storybook/jest';
import { within, userEvent, waitFor } from '@storybook/testing-library';

import { HeroForm } from './hero-form/hero-form.component';

export default {
  title: 'Addons/Interactions',
  component: HeroForm,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule],
    }),
  ],
} as Meta<HeroForm>;

const Template: Story<HeroForm> = (args) => ({
  props: args,
});

export const Standard: Story<HeroForm> = Template.bind({});

export const Filled: Story<HeroForm> = Template.bind({});
Filled.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const heroName = canvas.getByRole('textbox', {
    name: /name/i,
  });
  await userEvent.type(heroName, 'Storm');

  const alterEgo = canvas.getByRole('textbox', {
    name: /alter ego/i,
  });
  await userEvent.type(alterEgo, 'Ororo Munroe');

  const heroPower = canvas.getByRole('combobox', { name: /hero power/i });
  await userEvent.selectOptions(heroPower, 'Weather Changer');
};

export const InvalidFields: Story<HeroForm> = Template.bind({});
InvalidFields.play = async (context) => {
  await Filled.play(context);

  const canvas = within(context.canvasElement);
  await userEvent.clear(
    canvas.getByRole('textbox', {
      name: /name/i,
    })
  );
  await userEvent.clear(
    canvas.getByRole('textbox', {
      name: /alter ego/i,
    })
  );

  const heroPower = canvas.getByRole('combobox', { name: /hero power/i });
  await userEvent.selectOptions(heroPower, '');
};

export const Submitted: Story<HeroForm> = Template.bind({});
Submitted.play = async (context) => {
  await Filled.play(context);

  const canvas = within(context.canvasElement);
  await userEvent.click(canvas.getByText('Submit'));

  await waitFor(async () => {
    await expect(
      canvas.getByRole('heading', {
        name: /you submitted the following:/i,
      })
    ).not.toBeNull();
    await expect(canvas.getByTestId('hero-name').textContent).toEqual('Storm');
    await expect(canvas.getByTestId('hero-alterego').textContent).toEqual('Ororo Munroe');
    await expect(canvas.getByTestId('hero-power').textContent).toEqual('Weather Changer');
  });
};

export const SubmittedAndEditedAfter: Story<HeroForm> = Template.bind({});
SubmittedAndEditedAfter.play = async (context) => {
  await Submitted.play(context);

  const canvas = within(context.canvasElement);
  await userEvent.click(canvas.getByText('Edit'));

  const heroName = canvas.getByRole('textbox', {
    name: /name/i,
  });
  await userEvent.clear(heroName);
  await userEvent.type(heroName, 'Wakanda Queen');

  await userEvent.click(canvas.getByText('Submit'));

  await waitFor(async () => {
    await expect(
      canvas.getByRole('heading', {
        name: /you submitted the following:/i,
      })
    ).not.toBeNull();
    // new value
    await expect(canvas.getByTestId('hero-name').textContent).toEqual('Wakanda Queen');

    // previous values
    await expect(canvas.getByTestId('hero-alterego').textContent).toEqual('Ororo Munroe');
    await expect(canvas.getByTestId('hero-power').textContent).toEqual('Weather Changer');
  });
};
