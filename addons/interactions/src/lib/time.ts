import { instrument } from './instrumenter';

export const { sleep } = instrument(
  { sleep: (ms: number) => new Promise((r) => setTimeout(r, ms)) },
  { intercept: true }
);

export const { tick } = instrument({ tick: () => new Promise((r) => setTimeout(r)) });
