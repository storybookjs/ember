import { expect } from '@storybook/jest';
import { within, waitFor, fireEvent, userEvent } from '@storybook/testing-library';
import React from 'react';

import { AccountForm } from './AccountForm';
import { sleep, tick } from '../../lib/time';

export default {
  title: 'Addons/Interactions/AccountForm',
  component: AccountForm,
  parameters: { layout: 'centered' },
  argTypes: {
    onSubmit: { action: true },
  },
};

export const Demo = (args: any) => (
  <button type="button" onClick={() => args.onSubmit('clicked')}>
    Click
  </button>
);
Demo.play = async ({ args, canvasElement }: any) => {
  await userEvent.click(within(canvasElement).getByText('Click'));
  await expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
};

export const WaitFor = (args: any) => (
  <button type="button" onClick={() => setTimeout(() => args.onSubmit('clicked'), 100)}>
    Click
  </button>
);
WaitFor.play = async ({ args, canvasElement }: any) => {
  await userEvent.click(await within(canvasElement).findByText('Click'));
  await waitFor(() => {
    expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
  });
};

export const Standard = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);
    await fireEvent.change(canvas.getByTestId('email'), {
      target: {
        value: 'michael@chromatic.com',
      },
    });
  },
};

export const StandardEmailFailed = {
  ...Standard,
  play: async ({ args, canvasElement }: any) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId('email'), 'me');
    await userEvent.type(canvas.getByTestId('password1'), 'helloyou');
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }));

    await tick();
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await canvas.findByText('Please enter a correctly formatted email address');
  },
};

export const StandardEmailSuccess = {
  ...Standard,
  play: async ({ args, canvasElement }: any) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));
    await tick();
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'michael@chromatic.com',
      password: 'testpasswordthatwontfail',
    });
  },
};

export const StandardPasswordFailed = {
  ...Standard,
  play: async (context: any) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const StandardFailHover = {
  ...StandardPasswordFailed,
  play: async (context: any) => {
    const canvas = within(context.canvasElement);
    await StandardPasswordFailed.play(context);
    await sleep(2000);
    await userEvent.hover(canvas.getByTestId('password-error-info'));
  },
};

export const Verification = {
  args: { passwordVerification: true },
  argTypes: { onSubmit: { action: 'clicked' } },
};

export const VerificationPasssword1 = {
  ...Verification,
  play: async (context: any) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationPasswordMismatch = {
  ...Verification,
  play: async (context: any) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.type(canvas.getByTestId('password2'), 'asdf1234');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationSuccess = {
  ...Verification,
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);
    await StandardEmailFilled.play({ canvasElement });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password1'), 'helloyou', { delay: 50 });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password2'), 'helloyou', { delay: 50 });
    await sleep(1000);
    await userEvent.click(canvas.getByTestId('submit'));
  },
};
