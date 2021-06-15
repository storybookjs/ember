import React from 'react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

const Input = () => <input data-testid="test-input" />;

export default {
  title: 'Other/Demo/Setup',
  component: Input,
};

export const WithSetup = {
  setup: () => screen.getAllByTestId('test-input').map((elt) => userEvent.type(elt, 'asdfasdf')),
};
