import { Channel, Globals } from './types';

export class GlobalsStore {
  globals: Globals;

  constructor({ channel }: { channel: Channel }) {
    // TODO -- watch + emit on channel

    // QN -- how do globals get initialized?
    //   -- we need to get passed metadata after preview entries are initialized.
    this.globals = {};
  }

  get() {
    return this.globals;
  }

  update() {
    // TODO: set, emit
  }
}
