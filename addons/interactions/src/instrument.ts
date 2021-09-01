import { addons } from '@storybook/addons';
import { IGNORED_EXCEPTION } from '@storybook/core-events';
import global from 'global';

import { EVENTS } from './constants';
import { Call, CallRef, CallState } from './types';

const channel = addons.getChannel();

export interface Options {
  intercept?: boolean;
  mutate?: boolean;
  path?: Array<string | CallRef>;
}

export interface PatchedFunction extends Function {
  _original: Function;
}

global.window.__STORYBOOK_ADDON_TEST__ = global.window.__STORYBOOK_ADDON_TEST__ || {
  n: 0,
  next: undefined,
  callRefsByResult: new Map(),
};

const iframeState = global.window.__STORYBOOK_ADDON_TEST__;
const sharedState = global.window.parent.__STORYBOOK_ADDON_TEST__;

channel.on(EVENTS.NEXT, () => iframeState.next && iframeState.next());
channel.on(EVENTS.RELOAD, () => global.window.location.reload());
channel.on(EVENTS.RESET, () => {
  iframeState.n = 0;
  iframeState.next = undefined;
  iframeState.callRefsByResult.clear();
});

const isObject = (o: unknown) => Object.prototype.toString.call(o) === '[object Object]';
const isModule = (o: unknown) => Object.prototype.toString.call(o) === '[object Module]';

function isInstrumentable(o: unknown) {
  if (!isObject(o) && !isModule(o)) return false;
  if (o.constructor === undefined) return true;
  const proto = o.constructor.prototype;
  if (!isObject(proto)) return false;
  if (proto.hasOwnProperty('isPrototypeOf') === false) return false;
  return true;
}

function construct(obj: any) {
  try {
    return new obj.constructor();
  } catch (e) {
    return {};
  }
}

function run(fn: Function, call: Call) {
  // Map args that originate from a tracked function call to a call reference to enable nesting.
  // These values are often not fully serializable anyway (e.g. DOM elements).
  const mappedArgs = call.args.map((arg) => {
    if (iframeState.callRefsByResult.has(arg)) {
      return iframeState.callRefsByResult.get(arg);
    }
    if (arg instanceof Element) {
      const { prefix, localName, id, classList } = arg;
      return { __element__: { prefix, localName, id, classList } };
    }
    return arg;
  });

  try {
    const result = fn(...call.args);
    channel.emit(EVENTS.CALL, { ...call, args: mappedArgs, state: CallState.DONE });
    if (result && typeof result === 'object') {
      // Track the result so we can trace later uses of it back to the originating call.
      // Primitive results (undefined, string, number, boolean) and null are ignored.
      iframeState.callRefsByResult.set(result, { __callId__: call.id });
    }
    return result;
  } catch (e) {
    if (e instanceof Error) {
      const { name, message, stack } = e;
      const exception = { name, message, stack };
      channel.emit(EVENTS.CALL, { ...call, args: mappedArgs, state: CallState.ERROR, exception });
      throw IGNORED_EXCEPTION; // Storybook will catch and silently ignore this
    }
    throw e;
  }
}

function intercept(fn: Function, call: Call) {
  // For a "jump to step" action, continue playing until we hit a call by that ID.
  // For chained calls, we can only return a Promise for the last call in the chain.
  const isChainedUpon = sharedState.chainedCallIds.has(call.id);
  if (sharedState.playUntil || isChainedUpon || !sharedState.isDebugging) {
    if (sharedState.playUntil === call.id) sharedState.playUntil = undefined;
    return run(fn, call);
  }

  // Instead of invoking the function, defer the function call until we continue playing.
  return new Promise((resolve) => (iframeState.next = resolve))
    .then(() => (iframeState.next = undefined))
    .then(() => run(fn, call));
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the invocation ("call") and
// returns the original result.
function track(method: string, fn: Function, args: any[], { path = [], ...options }: Options) {
  const id = `${iframeState.n++}-${method}`;
  const call: Call = { id, path, method, args, interceptable: !!options.intercept };
  const result = (options.intercept ? intercept : run)(fn, call);
  return instrument(result, { ...options, path: [{ __callId__: call.id }] });
}

function patch(method: string, fn: Function, options: Options): PatchedFunction {
  if ((fn as PatchedFunction)._original) return fn as PatchedFunction; // already patched
  const patched: PatchedFunction = (...args: any[]) => track(method, fn, args, options);
  patched._original = fn;
  return patched;
}

// Traverses the object structure to recursively patch all function properties.
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj: unknown, options: Options = {}) {
  if (!isInstrumentable(obj)) return obj;
  const { mutate = false, path = [] } = options;
  return Object.keys(obj).reduce(
    (acc, key) => {
      const value = (obj as Record<string, any>)[key];
      if (typeof value === 'function') {
        acc[key] = patch(key, value, options);
        // Deal with functions that also act like an object
        // TODO might be able to make functions instrumentable so we can omit this extra if statement
        if (Object.keys(value).length > 0) {
          Object.assign(acc[key], instrument({ ...value }, { ...options, path: path.concat(key) }));
        }
      } else {
        acc[key] = instrument(value, { ...options, path: path.concat(key) });
      }
      return acc;
    },
    mutate ? obj : construct(obj)
  );
}
