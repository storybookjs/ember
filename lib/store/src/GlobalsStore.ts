import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import { Globals, GlobalTypes } from '@storybook/csf';

import { deepDiff, DEEPLY_EQUAL } from './args';

const setUndeclaredWarning = deprecate(
  () => {},
  dedent`
    Setting a global value that is undeclared (i.e. not in the user's initial set of globals
    or globalTypes) is deprecated and will have no effect in 7.0.
  `
);

export class GlobalsStore {
  allowedGlobalNames: Set<string>;

  initialGlobals: Globals;

  globals: Globals = {};

  // NOTE: globals are initialized every time the preview entries are loaded
  // This happens both initially when the SB first loads, and also on HMR
  initialize({ globals, globalTypes }: { globals: Globals; globalTypes: GlobalTypes }) {
    this.setInitialGlobals({ globals, globalTypes });
    this.globals = this.initialGlobals;
  }

  setInitialGlobals({
    globals = {},
    globalTypes = {},
  }: {
    globals?: Globals;
    globalTypes?: GlobalTypes;
  }) {
    this.allowedGlobalNames = new Set([...Object.keys(globals), ...Object.keys(globalTypes)]);

    const defaultGlobals = Object.entries(globalTypes).reduce((acc, [key, { defaultValue }]) => {
      if (defaultValue) acc[key] = defaultValue;
      return acc;
    }, {} as Globals);
    this.initialGlobals = { ...defaultGlobals, ...globals };
  }

  filterAllowedGlobals(globals: Globals) {
    return Object.entries(globals).reduce((acc, [key, value]) => {
      if (this.allowedGlobalNames.has(key)) acc[key] = value;
      return acc;
    }, {} as Globals);
  }

  updateFromPersisted(persisted: Globals) {
    const allowedUrlGlobals = this.filterAllowedGlobals(persisted);
    // Note that unlike args, we do not have the same type information for globals to allow us
    // to type check them here, so we just set them naively
    this.globals = { ...this.globals, ...allowedUrlGlobals };
  }

  resetOnProjectAnnotationsChange({
    globals,
    globalTypes,
  }: {
    globals: Globals;
    globalTypes: GlobalTypes;
  }) {
    const delta = deepDiff(this.initialGlobals, this.globals);

    this.setInitialGlobals({ globals, globalTypes });

    this.globals = this.initialGlobals;
    if (delta !== DEEPLY_EQUAL) {
      this.updateFromPersisted(delta);
    }
  }

  get() {
    return this.globals;
  }

  update(newGlobals: Globals) {
    Object.keys(newGlobals).forEach((key) => {
      if (!this.allowedGlobalNames.has(key)) {
        setUndeclaredWarning();
      }
    });

    this.globals = { ...this.globals, ...newGlobals };
  }
}
