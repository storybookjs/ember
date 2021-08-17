import { Globals, GlobalTypes } from './types';
import { combineArgs, deepDiff, DEEPLY_EQUAL } from '../args';

export class GlobalsStore {
  allowedGlobalNames: Set<string>;

  initialGlobals: Globals;

  globals: Globals = {};

  // NOTE: globals are initialized every time the preview entries are loaded
  // This happens both initially when the SB first loads, and also on HMR
  constructor({ globals, globalTypes }: { globals: Globals; globalTypes: GlobalTypes }) {
    this.setInitialGlobals({ globals, globalTypes });
    this.globals = this.initialGlobals;
  }

  setInitialGlobals({ globals, globalTypes }: { globals: Globals; globalTypes: GlobalTypes }) {
    this.allowedGlobalNames = new Set([...Object.keys(globals), ...Object.keys(globalTypes)]);

    const defaultGlobals = Object.entries(globalTypes).reduce((acc, [arg, { defaultValue }]) => {
      if (defaultValue) acc[arg] = defaultValue;
      return acc;
    }, {} as Globals);
    this.initialGlobals = { ...defaultGlobals, ...globals };
  }

  updateFromPersisted(persisted: Globals) {
    const allowedUrlGlobals = Object.entries(persisted).reduce((acc, [key, value]) => {
      if (this.allowedGlobalNames.has(key)) acc[key] = value;
      return acc;
    }, {} as Globals);

    // Note that unlike args, we do not have the same type information for globals to allow us
    // to type check them here, so we just set them naively
    this.globals = { ...this.globals, ...allowedUrlGlobals };
  }

  resetOnGlobalMetaChange({
    globals,
    globalTypes,
  }: {
    globals: Globals;
    globalTypes: GlobalTypes;
  }) {
    const delta = deepDiff(this.initialGlobals, this.globals);

    this.setInitialGlobals({ globals, globalTypes });

    this.globals =
      delta === DEEPLY_EQUAL ? this.initialGlobals : combineArgs(this.initialGlobals, delta);
  }

  get() {
    return this.globals;
  }

  update(newGlobals: Globals) {
    this.globals = { ...this.globals, ...newGlobals };
  }
}
