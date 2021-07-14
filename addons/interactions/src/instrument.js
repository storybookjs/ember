import { addons } from "@storybook/addons";
import { EVENTS } from "./constants";

const interceptions = [];
const callsByResult = new Map();
const resultsByCallId = new Map();
const channel = addons.getChannel();

const emitCall = ({
  id,
  path,
  method,
  args: originalArgs,
  result,
  skipped,
}) => {
  const key = path.concat(method).join(".");
  const args = originalArgs.map((arg) => callsByResult.get(arg) || arg);
  callsByResult.set(result, { __callId__: id });
  resultsByCallId.set(id, result);
  channel.emit(EVENTS.CALL, { id, key, args, skipped });
};

channel.on(EVENTS.NEXT, () => {
  const [id, fn, args] = interceptions.shift();
  const result = fn(...args.map((arg) => resultsByCallId.get(arg?.__callId__) || arg));
  callsByResult.set(result, { __callId__: id });
  resultsByCallId.set(id, result);
});

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the
// invocation ("call") and returns the original result.
export function patch(obj, method, path = []) {
  const fn = obj[method];
  if (fn._original) return fn; // already patched

  const key = path.concat(method).join(".");
  const patched = (...originalArgs) => {
    const id = Math.random().toString(16).slice(2);
    const args = originalArgs.map((arg) => callsByResult.get(arg) || arg);
    if (window.paused) interceptions.push([id, fn, args]);
    
    // TODO return recorded result when paused
    const result = window.paused ? undefined : fn(...originalArgs);
    callsByResult.set(result, { __callId__: id });
    resultsByCallId.set(id, result);
    channel.emit(EVENTS.CALL, { id, key, args, skipped: window.paused });
    return result;
  };
  patched._original = fn;
  return patched;
}

// Traverses the object structure to patch all methods (functions on an object)
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj, mutate = true, path = []) {
  if (obj === null || typeof obj !== "object") return obj;
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[key] =
        typeof obj[key] === "function"
          ? patch(obj, key, path)
          : instrument(obj[key], mutate, path.concat(key));
      return acc;
    },
    mutate ? obj : obj.constructor ? new obj.constructor() : {}
  );
}
