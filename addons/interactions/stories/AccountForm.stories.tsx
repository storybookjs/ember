import { AccountForm } from './AccountForm';
import { screen, within } from '../src/dom';
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

export const Demo = (args) => (
  <button onClick={() => args.onSubmit('clicked')}>Click</button>
);
Demo.argTypes = {
  onSubmit: { action: true },
};
Demo.play = async ({ args }) => {
  await userEvent.click(screen.getByText('Click'));
  await expect(args.onSubmit).toHaveBeenCalledWith(expect.stringMatching(/([A-Z])\w+/gi));
};

export const Standard = {
  args: { passwordVerification: false },
};

export const StandardEmailFilled = {
  ...Standard,
  play: async ({ args, containerId }) => {
    const canvas = within(document.getElementById(containerId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await expect({ hello: 1 }).not.toBe(new Error('cool'));
  },
};

export const StandardEmailFailed = {
  ...Standard,
  play: async ({ args, containerId }) => {
    const canvas = within(document.getElementById(containerId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com.com@com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));
    await tick();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const StandardEmailSuccess = {
  ...Standard,
  play: async ({ args, containerId }) => {
    const canvas = within(document.getElementById(containerId));
    await userEvent.type(canvas.getByTestId('email'), 'michael@chromatic.com');
    await userEvent.type(canvas.getByTestId('password1'), 'testpasswordthatwontfail');
    await userEvent.click(canvas.getByTestId('submit'));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'michael@chromatic.coma',
      password: 'testpasswordthatwontfail',
    });
    await userEvent.type(canvas.getByTestId('email'), 'yeah');
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
  argTypes: { onSubmit: { action: 'clicked' } },
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
  play: async ({ args, containerId }) => {
    const canvas = within(document.getElementById(containerId));
    await StandardEmailFilled.play({ args, containerId });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password1'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.type(canvas.getByTestId('password2'), 'asdfasdf', { delay: 50 });
    await sleep(1000);
    await userEvent.click(canvas.getByTestId('submit'));
  },
};
