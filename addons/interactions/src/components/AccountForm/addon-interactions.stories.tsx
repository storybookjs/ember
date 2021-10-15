import { Story as CSF2Story, Meta, ComponentStoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { within, waitFor, fireEvent, userEvent } from '@storybook/testing-library';
import React from 'react';

import { AccountForm } from './AccountForm';

export default {
  title: 'Addons/Interactions/AccountForm',
  component: AccountForm,
  parameters: { layout: 'centered', theme: 'light' },
  argTypes: {
    onSubmit: { action: true },
  },
} as Meta;

type CSF3Story = ComponentStoryObj<typeof AccountForm>;

export const Demo: CSF2Story = (args) => (
  <button type="button" onClick={() => args.onSubmit('clicked')}>
    Click
  </button>
);
Demo.play = async ({ args, canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button'));
  await expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
};

export const WaitFor: CSF2Story = (args) => (
  <button type="button" onClick={() => setTimeout(() => args.onSubmit('clicked'), 100)}>
    Click
  </button>
);
WaitFor.play = async ({ args, canvasElement }) => {
  await userEvent.click(await within(canvasElement).findByText('Click'));
  await waitFor(async () => {
    await expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
  });
};

export const Standard: CSF3Story = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled: CSF3Story = {
  ...Standard,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.change(canvas.getByTestId('email'), {
      target: {
        value: 'michael@chromatic.com',
      },
    });
  },
};

export const StandardEmailFailed: CSF3Story = {
  ...Standard,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId('email'), 'me');
    await userEvent.type(canvas.getByTestId('password1'), 'helloyou');
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }));

    await canvas.findByText(
      'Please enter a correctly formatted email address',
      {},
      { timeout: 2000 }
    );
    expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const StandardEmailSuccess: CSF3Story = {
  ...Standard,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));

    await waitFor(async () => {
      await expect(args.onSubmit).toHaveBeenCalledTimes(1);
      await expect(args.onSubmit).toHaveBeenCalledWith({
        email: 'michael@chromatic.com',
        password: 'testpasswordthatwontfail',
      });
    });
  },
};

export const StandardPasswordFailed: CSF3Story = {
  ...Standard,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const StandardFailHover: CSF3Story = {
  ...StandardPasswordFailed,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await StandardPasswordFailed.play(context);
    await waitFor(async () => {
      await userEvent.hover(canvas.getByTestId('password-error-info'));
    });
  },
};

export const Verification: CSF3Story = {
  args: { passwordVerification: true },
  argTypes: { onSubmit: { action: 'clicked' } },
};

export const VerificationPasssword1: CSF3Story = {
  ...Verification,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationPasswordMismatch: CSF3Story = {
  ...Verification,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.type(canvas.getByTestId('password2'), 'asdf1234');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationSuccess: CSF3Story = {
  ...Verification,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    await StandardEmailFilled.play(context);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.type(canvas.getByTestId('password1'), 'helloyou', { delay: 50 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.type(canvas.getByTestId('password2'), 'helloyou', { delay: 50 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.click(canvas.getByTestId('submit'));
  },
};
