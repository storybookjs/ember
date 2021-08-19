import { AccountForm } from './AccountForm';
import { within } from '../src/dom';
import userEvent from '../src/user-event';
import { sleep } from '../src/sleep';
import { expect } from '../src/expect';

export default {
  component: AccountForm,
  parameters: { layout: 'centered' },
};

export const Standard = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await expect(true).not.toBe(true);
    await expect({ hello: 1 }).not.toBe(new Error("cool"));
  },
};

export const StandardEmailFailed = {
  ...Standard,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com.com@com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const StandardPasswordFailed = {
  ...Standard,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const StandardFailHover = {
  ...StandardPasswordFailed,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await StandardPasswordFailed.play(context);
    // await sleep(1000)
    await userEvent.hover(canvas.getByTestId('password-error-info'));
  },
};

export const Verification = {
  args: { passwordVerification: true },
};

export const VerificationPasssword1 = {
  ...Verification,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationPasswordMismatch = {
  ...Verification,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await StandardEmailFilled.play(context);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf');
    await userEvent.type(canvas.getByTestId('password2'), 'asdf1234');
    await userEvent.click(canvas.getByTestId('submit'));
  },
};

export const VerificationSuccess = {
  ...Verification,
  play: async (context) => {
    const canvas = within(document.getElementById(context.containerId));
    await StandardEmailFilled.play(context);
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password2'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.click(canvas.getByTestId('submit'));
  },
};
