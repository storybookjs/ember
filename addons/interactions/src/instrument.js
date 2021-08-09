import { addons } from "@storybook/addons";
import { EVENTS } from "./constants";

const callsByResult = new Map();
const channel = addons.getChannel();

let next
channel.on(EVENTS.NEXT, () => {
  console.log(next)
  if (next) next()
});

channel.on(EVENTS.RELOAD, () => {
  window.location.reload()
});

function intercept(fn) {
  if (!window.parent.__debugging__) return fn
  return (...args) => new Promise(resolve => (next = resolve)).then(() => {
    next = undefined
    return fn(...args)
  })
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the
// invocation ("call") and returns the original result.
function track(key, fn, originalArgs, intercepted) {
  const id = Math.random().toString(16).slice(2);
  const args = originalArgs.map((arg) => callsByResult.get(arg) || arg);
  const result = intercepted ? intercept(fn)(...originalArgs) : fn(...originalArgs)
  callsByResult.set(result, { __callId__: id });
  console.log({key, intercepted})
  channel.emit(EVENTS.CALL, { id, key, args, intercepted });
  return result
}

function patch(obj, method, path = [], intercept = true) {
  const fn = obj[method];
  if (fn._original) return fn; // already patched
  const key = [...path, method].join(".")
  const patched = (...args) => track(key, fn, args, intercept)
  patched._original = fn
  return patched
}

// Traverses the object structure to recursively patch all function properties.
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj, mutate = true, intercept = true, path = []) {
  if (obj === null || typeof obj !== "object") return obj;
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[key] =
        typeof obj[key] === "function"
          ? patch(obj, key, path, intercept)
          : instrument(obj[key], mutate, intercept, path.concat(key));
      return acc;
    },
    mutate ? obj : obj.constructor ? new obj.constructor() : {}
  );
}
