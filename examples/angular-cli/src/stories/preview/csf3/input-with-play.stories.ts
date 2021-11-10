import { screen, userEvent, within } from '@storybook/testing-library';
import { InputComponent } from './sb-input.component';

export default {
  title: 'Preview/CSF3/WithPlayFunction',
  component: InputComponent,
  parameters: {
    // disabled : Not compatible yet with csf3
    storyshots: { disable: true },
  },
};

export const Default = {
  title: 'Default',
  play: async () => {
    const input = await screen.getByAltText('sb-input');
    await userEvent.type(input, `Typing from CSF3`);
  },
};

export const WithTemplate = {
  title: 'Template',
  render: (props) => ({
    props,
    template: '<h1>Heading</h1><sb-input></sb-input>',
  }),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByAltText('sb-input');
    await userEvent.type(input, `Typing from CSF3`);
  },
};
