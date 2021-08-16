import { addons } from '@storybook/addons';
import { EVENTS } from './constants';

const callsByResult = new Map();
const channel = addons.getChannel();

let next;
channel.on(EVENTS.NEXT, () => next && next());
channel.on(EVENTS.RELOAD, () => window.location.reload());

const isObject = (o) => Object.prototype.toString.call(o) === '[object Object]';
const isModule = (o) => Object.prototype.toString.call(o) === '[object Module]';

function isPatchable(o) {
  if (!isObject(o) && !isModule(o)) return false;
  if (o.constructor === undefined) return true;
  const proto = o.constructor.prototype;
  if (!isObject(proto)) return false;
  if (proto.hasOwnProperty('isPrototypeOf') === false) return false;
  return true;
}

function catchException(fn, args) {
  try {
    return fn(...args);
  } catch (e) {
    const { message, stack, matcherResult } = e;
    channel.emit(EVENTS.EXCEPTION, { callId, message, stack, matcherResult });
  }
}

function intercept(fn, callId) {
  if (!window.parent.__IS_DEBUGGING__) return fn;
  return (...args) => {
    if (window.parent.__CHAINED_CALL_IDS__.includes(callId)) return fn(...args);
    if (window.parent.__PLAY_UNTIL__) {
      if (window.parent.__PLAY_UNTIL__ === callId) window.parent.__PLAY_UNTIL__ = undefined;
      return fn(...args);
    }
    return new Promise((resolve) => (next = resolve))
      .then(() => (next = undefined))
      .then(() => catchException(fn, args));
  };
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the
// invocation ("call") and returns the original result.
let n = 0;
function track(method, fn, originalArgs, { path = [], ...options }) {
  const id = `${n++}-${method}`;
  const args = originalArgs.map((arg) => callsByResult.get(arg) || arg);
  const result = catchException(options.intercept ? intercept(fn, id) : fn, originalArgs);
  channel.emit(EVENTS.CALL, { id, path, method, args });
  callsByResult.set(result, { __callId__: id });
  return instrument(result, { ...options, path: [{ __callId__: id }] });
}

function patch(method, fn, options) {
  if (fn._original) return fn; // already patched
  const patched = (...args) => track(method, fn, args, options);
  patched._original = fn;
  return patched;
}

// Traverses the object structure to recursively patch all function properties.
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj, options = {}) {
  if (!isPatchable(obj)) return obj;
  const { mutate = false, path = [] } = options;
  return Object.keys(obj).reduce(
    (acc, key) => {
      const value = obj[key];
      acc[key] =
        typeof value === 'function'
          ? patch(key, value, options)
          : instrument(value, { ...options, path: path.concat(key) });
      return acc;
    },
    mutate ? obj : obj.constructor ? new obj.constructor() : {}
  );
}
