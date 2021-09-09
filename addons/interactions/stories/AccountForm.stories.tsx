import React from 'react';
import global from 'global';
import { AccountForm } from './AccountForm';
import { screen, within, waitFor } from '../src/dom';
import userEvent from '../src/user-event';
import { sleep, tick } from '../src/time';
import { expect } from '../src/expect';

export default {
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
Demo.argTypes = {
  onSubmit: { action: true },
};
Demo.play = async ({ args }: any) => {
  await userEvent.click(screen.getByText('Click'));
  await expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
};

export const WaitFor = (args: any) => (
  <button type="button" onClick={() => setTimeout(() => args.onSubmit('clicked'), 100)}>
    Click
  </button>
);
WaitFor.argTypes = {
  onSubmit: { action: true },
};
WaitFor.play = async ({ args }: any) => {
  await userEvent.click(await screen.findByText('Click'));
  await waitFor(() =>
    expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi))
  );
};

export const Standard = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  play: async ({ canvasId }: any) => {
    const canvas = within(global.document.getElementById(canvasId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await expect({ hello: 1 }).not.toBe(new Error('cool'));
  },
};

export const StandardEmailFailed = {
  ...Standard,
  play: async ({ args, canvasId }: any) => {
    const canvas = within(global.document.getElementById(canvasId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com.com@com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));
    await tick();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const StandardEmailSuccess = {
  ...Standard,
  play: async ({ args, canvasId }: any) => {
    const canvas = within(global.document.getElementById(canvasId));
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
    const canvas = within(global.document.getElementById(context.canvasId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const StandardFailHover = {
  ...StandardPasswordFailed,
  play: async (context: any) => {
    const canvas = within(global.document.getElementById(context.canvasId));
    await StandardPasswordFailed.play(context);
    await sleep(1000);
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
    const canvas = within(global.document.getElementById(context.canvasId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationPasswordMismatch = {
  ...Verification,
  play: async (context: any) => {
    const canvas = within(global.document.getElementById(context.canvasId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.type(canvas.getByTestId('password2'), 'asdf1234');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationSuccess = {
  ...Verification,
  play: async ({ canvasId }: any) => {
    const canvas = within(global.document.getElementById(canvasId));
    await StandardEmailFilled.play({ canvasId });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password2'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.click(canvas.getByTestId('submit'));
  },
};
