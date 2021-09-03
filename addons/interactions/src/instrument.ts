import { addons, Channel } from '@storybook/addons';
import { IGNORED_EXCEPTION } from '@storybook/core-events';
import global from 'global';

import { EVENTS } from './constants';
import { Call, CallRef, CallState } from './types';

export interface Options {
  intercept?: boolean;
  retain?: boolean;
  mutate?: boolean;
  path?: Array<string | CallRef>;
}

interface IframeState {
  n: number;
  next: Record<string, Function>;
  callRefsByResult: Map<any, CallRef>;
}

let channel: Channel;
let iframeState: IframeState;
let sharedState: any;

const init = () => {
  if (!global.window.__STORYBOOK_ADDON_TEST_PREVIEW__) {
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__ = {
      n: 0,
      next: {},
      callRefsByResult: new Map(),
    };
  }
  if (!global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__) {
    global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__ = {
      isDebugging: false,
      chainedCallIds: new Set<Call['id']>(),
      playUntil: undefined,
    };
  }

  channel = addons.getChannel();
  iframeState = global.window.__STORYBOOK_ADDON_TEST_PREVIEW__;
  sharedState = global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__;

  channel.on(EVENTS.NEXT, () => Object.values(iframeState.next).forEach((resolve) => resolve()));
  channel.on(EVENTS.RELOAD, () => global.window.location.reload());
  channel.on(EVENTS.SET_CURRENT_STORY, () => {
    iframeState.callRefsByResult = new Map(
      Array.from(iframeState.callRefsByResult.entries()).filter(([, val]) => val.retain)
    );
    iframeState.n = iframeState.callRefsByResult.size;
    iframeState.next = {};
  });
};

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

function invoke(fn: Function, call: Call) {
  // Map args that originate from a tracked function call to a call reference to enable nesting.
  // These values are often not fully serializable anyway (e.g. DOM elements).
  const mappedArgs = call.args.map((arg) => {
    if (iframeState.callRefsByResult.has(arg)) {
      return iframeState.callRefsByResult.get(arg);
    }
    if (arg instanceof global.window.Element) {
      const { prefix, localName, id, classList } = arg;
      return { __element__: { prefix, localName, id, classList } };
    }
    return arg;
  });

  // Mark any parent calls as "chained upon" so we won't attempt to defer it later.
  call.path.forEach((ref: any) => {
    ref?.__callId__ && sharedState.chainedCallIds.add(ref.__callId__);
  });

  try {
    const result = fn(...call.args);
    channel.emit(EVENTS.CALL, { ...call, args: mappedArgs, state: CallState.DONE });
    if (result && ['object', 'function', 'symbol'].includes(typeof result)) {
      // Track the result so we can trace later uses of it back to the originating call.
      // Primitive results (undefined, null, boolean, string, number, BigInt) are ignored.
      iframeState.callRefsByResult.set(result, { __callId__: call.id, retain: call.retain });
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
  if (!sharedState.isDebugging || isChainedUpon || sharedState.playUntil) {
    if (sharedState.playUntil === call.id) sharedState.playUntil = undefined;
    return invoke(fn, call);
  }

  // Instead of invoking the function, defer the function call until we continue playing.
  return new Promise((resolve) => (iframeState.next[call.id] = resolve))
    .then(() => delete iframeState.next[call.id])
    .then(() => invoke(fn, call));
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the invocation ("call") and
// returns the original result.
function track(method: string, fn: Function, args: any[], { path = [], ...options }: Options) {
  const id = `${iframeState.n++}-${method}`;
  const { intercept: interceptable = false, retain = false } = options;
  const call: Call = { id, path, method, args, interceptable, retain };
  const result = (options.intercept ? intercept : invoke)(fn, call);
  return instrument(result, { ...options, mutate: true, path: [{ __callId__: call.id }] });
}

function patch(method: string, fn: Function, options: Options) {
  const patched = (...args: any[]) => track(method, fn, args, options);
  Object.defineProperty(patched, 'name', { value: method, writable: false });
  return patched;
}

// Traverses the object structure to recursively patch all function properties.
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj: unknown, options: Options = {}) {
  if (!isInstrumentable(obj)) return obj;
  if (!channel) init();

  const { mutate = false, path = [] } = options;
  return Object.keys(obj).reduce(
    (acc, key) => {
      const value = (obj as Record<string, any>)[key];

      // Nothing to patch, but might be instrumentable, so we recurse
      if (typeof value !== 'function') {
        acc[key] = instrument(value, { ...options, path: path.concat(key) });
        return acc;
      }

      // Already patched, so we pass through unchanged
      if (typeof value._original === 'function') {
        acc[key] = value;
        return acc;
      }

      // Patch the function and mark it "patched" by adding a reference to the original function
      acc[key] = patch(key, value, options);
      acc[key]._original = value;

      // Deal with functions that also act like an object
      // TODO might be able to make functions instrumentable so we can omit this extra step
      if (Object.keys(value).length > 0) {
        Object.assign(acc[key], instrument({ ...value }, { ...options, path: path.concat(key) }));
      }

      return acc;
    },
    mutate ? obj : construct(obj)
  );
}
