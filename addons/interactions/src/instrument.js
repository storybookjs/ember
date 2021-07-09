import { addons } from '@storybook/addons';
import { EVENTS } from './constants'

const calls = new Map()
const channel = addons.getChannel()

const emitCall = ({ path, method, args: originalArgs, result }) => {
  const id = Math.random().toString(16).slice(2)
  const key = path.concat(method).join('.')
  const args = originalArgs.map(arg => calls.get(arg) || arg)
  calls.set(result, { __callId__: id })
  channel.emit(EVENTS.CALL, { id, key, args })
}

// Monkey patch an object method to record calls.
// Returns a function that invokes the original function, records the
// invocation ("call") and returns the original result.
export function patch(obj, method, path = []) {
  const fn = obj[method]
  if (fn._original) return fn // already patched

  const patched = (...args) => {
    const result = fn(...args)
    emitCall({ path, method, args, result })
    return result
  }
  patched._original = fn
  return patched
}

// Traverses the object structure to patch all methods (functions on an object)
// Returns the original object, or a new object with the same constructor,
// depending on whether it should mutate.
export function instrument(obj, mutate = true, path = []) {
  if (obj === null || typeof obj !== "object") return obj
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[key] =
        typeof obj[key] === "function"
          ? patch(obj, key, path)
          : instrument(obj[key], mutate, path.concat(key))
      return acc
    },
    mutate ? obj : obj.constructor ? new obj.constructor() : {}
  )
}
