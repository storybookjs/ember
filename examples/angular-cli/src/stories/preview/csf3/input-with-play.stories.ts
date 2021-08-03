import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputComponent } from './sb-input.component';

export default {
  title: 'Preview/CSF3/WithPlayFunction',
  component: InputComponent,
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
  play: async () => {
    const input = await screen.getByAltText('sb-input');
    await userEvent.type(input, `Typing from CSF3`);
  },
};
