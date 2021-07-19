import React from 'react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

const Input = () => <input data-testid="test-input" />;

export default {
  title: 'Other/Demo/Setup',
  component: Input,
};

export const WithPlay = {
  play: async () => {
    const inputs = screen.getAllByTestId('test-input');
    for (let i = 0; i < inputs.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await userEvent.type(inputs[i], 'asdfasdf', { delay: 10 });
    }
  },
};
