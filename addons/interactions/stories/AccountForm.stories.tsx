import { AccountForm } from "./AccountForm"
import { screen } from "../src/dom"
import userEvent from "../src/user-event"
import { sleep } from "../src/sleep"

export default {
  component: AccountForm,
  parameters: { layout: "centered" },
}

export const Standard = {
  args: { passwordVerification: false },
}

export const StandardEmailFilled = {
  ...Standard,
  play: async () => {
    await userEvent.type(screen.getByTestId("email"), "michael@chromatic.com")
  },
}

export const StandardEmailFailed = {
  ...Standard,
  play: async () => {
    await userEvent.type(screen.getByTestId("email"), "michael@chromatic.com.com@com")
    await userEvent.type(screen.getByTestId("password1"), "testpasswordthatwontfail")
    await userEvent.click(screen.getByTestId("submit"))
  },
}

export const StandardPasswordFailed = {
  ...Standard,
  play: async () => {
    await StandardEmailFilled.play()
    await userEvent.type(screen.getByTestId("password1"), "asdf")
    await userEvent.click(screen.getByTestId("submit"))
  },
}

export const StandardFailHover = {
  ...StandardPasswordFailed,
  play: async () => {
    await StandardPasswordFailed.play()
    await sleep(100)
    await userEvent.hover(screen.getByTestId("password-error-info"))
  },
}

export const Verification = {
  args: { passwordVerification: true },
}

export const VerificationPasssword1 = {
  ...Verification,
  play: async () => {
    await StandardEmailFilled.play()
    await userEvent.type(screen.getByTestId("password1"), "asdfasdf")
    await userEvent.click(screen.getByTestId("submit"))
  },
}

export const VerificationPasswordMismatch = {
  ...Verification,
  play: async () => {
    await StandardEmailFilled.play()
    await userEvent.type(screen.getByTestId("password1"), "asdfasdf")
    await userEvent.type(screen.getByTestId("password2"), "asdf1234")
    await userEvent.click(screen.getByTestId("submit"))
  },
}

export const VerificationSuccess = {
  ...Verification,
  play: async () => {
    await StandardEmailFilled.play()
    await sleep(1000)
    await userEvent.type(screen.getByTestId("password1"), "asdfasdf", { delay: 50 })
    await sleep(1000)
    await userEvent.type(screen.getByTestId("password2"), "asdfasdf", { delay: 50 })
    await sleep(1000)
    await userEvent.click(screen.getByTestId("submit"))
  },
}
