import { addons } from '@storybook/addons';
import { EVENTS } from './constants';

const IgnoredException = 'IgnoredException';
const channel = addons.getChannel();

let n = 0;
let next = undefined;
const callRefsByResult = new Map();

channel.on(EVENTS.RESET, () => {
  n = 0;
  next = undefined;
  callRefsByResult.clear();
});
channel.on(EVENTS.NEXT, () => next && next());
channel.on(EVENTS.RELOAD, () => window.location.reload());

const isObject = (o) => Object.prototype.toString.call(o) === '[object Object]';
const isModule = (o) => Object.prototype.toString.call(o) === '[object Module]';

const isDebugging = () => !!window.parent.__STORYBOOK_IS_DEBUGGING__;
const getChainedCallIds = () => window.parent.__STORYBOOK_CHAINED_CALL_IDS__;
const getPlayUntil = () => window.parent.__STORYBOOK_PLAY_UNTIL__;
const clearPlayUntil = () => (window.parent.__STORYBOOK_PLAY_UNTIL__ = undefined);

function isPatchable(o) {
  if (!isObject(o) && !isModule(o)) return false;
  if (o.constructor === undefined) return true;
  const proto = o.constructor.prototype;
  if (!isObject(proto)) return false;
  if (proto.hasOwnProperty('isPrototypeOf') === false) return false;
  return true;
}

function run(fn, args, call) {
  // Map args that originate from a tracked function call to a call reference to enable nesting.
  // These values are often not serializable anyway (e.g. DOM elements).
  const mappedArgs = args.map((arg) => {
    if (callRefsByResult.has(arg)) return callRefsByResult.get(arg);
    if (arg instanceof Element) {
      const { prefix, localName, id, classList } = arg;
      return { __element__: { prefix, localName, id, classList } };
    }
    return arg;
  });

  try {
    const result = fn(...args);
    channel.emit(EVENTS.CALL, { ...call, args: mappedArgs });
    // Don't track generic results like null, undefined, true and false.
    if (result && result !== true) callRefsByResult.set(result, { __callId__: call.id });
    return result;
  } catch (e) {
    if (e instanceof Error) {
      const { name, message, stack, matcherResult } = e;
      const exception = { name, message, stack, matcherResult };
      channel.emit(EVENTS.CALL, { ...call, args: mappedArgs, exception });
      throw IgnoredException;
    }
    throw e;
  }
}

function intercept(fn, args, call) {
  // For a "jump to step" action, continue playing until we hit a call by that ID.
  // For chained calls, we can only return a Promise for the last call in the chain.
  const playUntil = getPlayUntil();
  const isChainedUpon = getChainedCallIds().has(call.id);
  if (playUntil || isChainedUpon || !isDebugging()) {
    if (playUntil === call.id) clearPlayUntil();
    return run(fn, args, call);
  }

  // Instead of invoking the function, defer the function call until we continue playing.
  return new Promise((resolve) => (next = resolve))
    .then(() => (next = undefined))
    .then(() => run(fn, args, call));
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the invocation ("call") and
// returns the original result.
function track(method, fn, args, { path = [], ...options }) {
  const call = { id: `${n++}-${method}`, path, method };
  const result = (options.intercept ? intercept : run)(fn, args, call);
  return instrument(result, { ...options, path: [{ __callId__: call.id }] });
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
