import userEvent from "@testing-library/user-event"
import { instrument } from './instrument'

instrument({ userEvent })

export default userEvent
