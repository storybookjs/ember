import { instrument } from './instrument'

export const { sleep } = instrument({
  sleep: (ms) => new Promise((r) => setTimeout(r, ms))
})
