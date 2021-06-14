import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { AccountForm } from './AccountForm';

export default {
  title: 'Demo/AccountForm',
  component: AccountForm,
  parameters: {
    layout: 'centered',
  },
} as ComponentMeta<typeof AccountForm>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const Standard = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  setup: () => userEvent.type(screen.getByTestId('email'), 'michael@chromatic.com'),
};

export const StandardEmailFailed = {
  ...Standard,
  setup: () => {
    StandardEmailFilled.setup();
    userEvent.click(screen.getByTestId('submit'));
  },
};

export const StandardPasswordFailed = {
  ...Standard,
  setup: () => {
    StandardEmailFilled.setup();
    userEvent.type(screen.getByTestId('password1'), 'asdf');
    userEvent.click(screen.getByTestId('submit'));
  },
};

export const Verification = {
  args: { passwordVerification: true },
};

export const VerificationPasssword1 = {
  ...Verification,
  setup: () => {
    StandardEmailFilled.setup();
    userEvent.type(screen.getByTestId('password1'), 'asdfasdf');
    userEvent.click(screen.getByTestId('submit'));
  },
};

export const VerificationPasswordMismatch = {
  ...Verification,
  setup: () => {
    StandardEmailFilled.setup();
    userEvent.type(screen.getByTestId('password1'), 'asdfasdf');
    userEvent.type(screen.getByTestId('password2'), 'asdf1234');
    userEvent.click(screen.getByTestId('submit'));
  },
};

export const VerificationSuccess = {
  ...Verification,
  setup: async () => {
    await StandardEmailFilled.setup();
    await sleep(1000);
    await userEvent.type(screen.getByTestId('password1'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.type(screen.getByTestId('password2'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    userEvent.click(screen.getByTestId('submit'));
  },
};
