import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { AccountForm, AccountFormProps } from './AccountForm';

export default {
  title: 'Demo/AccountForm',
  component: AccountForm,
  parameters: {
    layout: 'centered',
  },
} as ComponentMeta<typeof AccountForm>;

// export const Standard = (args: AccountFormProps) => <AccountForm {...args} />;
// Standard.args = { passwordVerification: false };

export const Standard = {
  // render: (args: AccountFormProps) => <AccountForm {...args} />,
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  setup: () => userEvent.type(screen.getByTestId('email'), 'michael@chromatic.com'),
};

export const StandardEmailFailed = {
  ...Standard,
  setup: () => {
    userEvent.type(screen.getByTestId('email'), 'michael@chromatic.com.com@com');
    userEvent.type(screen.getByTestId('password1'), 'testpasswordthatwontfail');
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

export const StandardFailHover = {
  ...StandardPasswordFailed,
  setup: async () => {
    await StandardPasswordFailed.setup();
    await sleep(100);
    userEvent.hover(screen.getByTestId('password-error-info'));
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
