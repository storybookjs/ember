import { addons } from '@storybook/addons';
import global from 'global';

import { EVENTS } from './constants';
import { Call, CallRef } from './types';

const IgnoredException = 'IgnoredException';
const channel = addons.getChannel();

export interface Options {
  intercept?: boolean;
  mutate?: boolean;
  path?: Array<string | CallRef>;
}

export interface PatchedFunction extends Function {
  _original: Function;
}

// TODO move to some global object
let n = 0;
let next: (value?: unknown) => void = undefined;
global.window.callRefsByResult = new Map();

channel.on(EVENTS.RESET, () => {
  n = 0;
  next = undefined;
  global.window.callRefsByResult.clear();
});
channel.on(EVENTS.NEXT, () => next && next());
channel.on(EVENTS.RELOAD, () => global.window.location.reload());

const isObject = (o: unknown) => Object.prototype.toString.call(o) === '[object Object]';
const isModule = (o: unknown) => Object.prototype.toString.call(o) === '[object Module]';

const isDebugging = () => !!global.window.parent.__STORYBOOK_IS_DEBUGGING__;
const getChainedCallIds = () => global.window.parent.__STORYBOOK_CHAINED_CALL_IDS__;
const getPlayUntil = () => global.window.parent.__STORYBOOK_PLAY_UNTIL__;
const clearPlayUntil = () => {
  global.window.parent.__STORYBOOK_PLAY_UNTIL__ = undefined;
};

function isPatchable(o: unknown) {
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
    if (global.window.callRefsByResult.has(arg)) {
      return global.window.callRefsByResult.get(arg);
    }
    if (arg instanceof Element) {
      const { prefix, localName, id, classList } = arg;
      return { __element__: { prefix, localName, id, classList } };
    }
    return arg;
  });

  try {
    const result = fn(...call.args);
    channel.emit(EVENTS.CALL, { ...call, args: mappedArgs });
    if (result && result !== true) {
      // Track the result so we can trace later uses of it back to the originating call.
      // Generic results like null, undefined, true and false are ignored.
      global.window.callRefsByResult.set(result, { __callId__: call.id });
    }
    return result;
  } catch (e) {
    if (e instanceof Error) {
      // @ts-expect-error Support Jest's matcherResult without directly depending on Jest
      const { name, message, stack, matcherResult } = e;
      const exception = { name, message, stack, matcherResult };
      channel.emit(EVENTS.CALL, { ...call, args: mappedArgs, exception });
      throw IgnoredException; // Storybook will catch and silently ignore this
    }
    throw e;
  }
}

function intercept(fn: Function, call: Call) {
  // For a "jump to step" action, continue playing until we hit a call by that ID.
  // For chained calls, we can only return a Promise for the last call in the chain.
  const playUntil = getPlayUntil();
  const isChainedUpon = getChainedCallIds().has(call.id);
  if (playUntil || isChainedUpon || !isDebugging()) {
    if (playUntil === call.id) clearPlayUntil();
    return run(fn, call);
  }

  // Instead of invoking the function, defer the function call until we continue playing.
  return new Promise((resolve) => (next = resolve))
    .then(() => (next = undefined))
    .then(() => run(fn, call));
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the invocation ("call") and
// returns the original result.
function track(method: string, fn: Function, args: any[], { path = [], ...options }: Options) {
  const id = `${n++}-${method}`;
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
  if (!isPatchable(obj)) return obj;
  const { mutate = false, path = [] } = options;
  return Object.keys(obj).reduce(
    (acc, key) => {
      const value = (obj as Record<string, any>)[key];
      if (typeof value === 'function') {
        acc[key] = patch(key, value, options);
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
