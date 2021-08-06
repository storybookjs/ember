import { Globals, GlobalTypes } from './types';
import { combineParameters } from '../parameters';

export class GlobalsStore {
  allowedGlobalNames: Set<string>;

  initialGlobals: Globals;

  globals: Globals = {};

  // NOTE: globals are initialized every time the preview entries are loaded
  // This happens both initially when the SB first loads, and also on HMR
  constructor({ globals, globalTypes }: { globals: Globals; globalTypes: GlobalTypes }) {
    this.allowedGlobalNames = new Set([...Object.keys(globals), ...Object.keys(globalTypes)]);

    const defaultGlobals = Object.entries(globalTypes).reduce((acc, [arg, { defaultValue }]) => {
      if (defaultValue) acc[arg] = defaultValue;
      return acc;
    }, {} as Globals);

    this.initialGlobals = { ...defaultGlobals, ...globals };

    // To deal with HMR & persistence, we consider the previous value of global args, and:
    //   1. Remove any keys that are not in the new parameter
    //   2. Preference any keys that were already set
    //   3. Use any new keys from the new parameter
    this.globals = Object.entries(this.globals).reduce(
      (acc, [key, previousValue]) => {
        if (this.allowedGlobalNames.has(key)) acc[key] = previousValue;

        return acc;
      },
      { ...this.initialGlobals }
    );
  }

  updateFromPersisted(persisted: Globals) {
    const allowedUrlGlobals = Object.entries(persisted).reduce((acc, [key, value]) => {
      if (this.allowedGlobalNames.has(key)) acc[key] = value;
      return acc;
    }, {} as Globals);
    // Note that unlike args, we do not have the same type information for globals to allow us
    // to type check them here, so we just set them naively
    this.globals = combineParameters(this.globals, allowedUrlGlobals);
  }

  get() {
    return this.globals;
  }

  update(newGlobals: Globals) {
    this.globals = { ...this.globals, ...newGlobals };
  }
}
