/* eslint-disable no-param-reassign */
import { sep } from 'path';

export interface IErrorWithStdErrAndStdOut {
  stderr?: Buffer | string;
  stdout?: Buffer | string;
  [key: string]: unknown;
}

// Removes all user paths
function regexpEscape(str: string): string {
  return str.replace(/[-[/{}()*+?.\\^$|]/g, `\\$&`);
}

export function cleanPaths(str: string, separator: string = sep): string {
  if (!str) return str;

  const stack = process.cwd().split(separator);

  while (stack.length > 1) {
    const currentPath = stack.join(separator);
    const currentRegex = new RegExp(regexpEscape(currentPath), `g`);
    str = str.replace(currentRegex, `$SNIP`);

    const currentPath2 = stack.join(separator + separator);
    const currentRegex2 = new RegExp(regexpEscape(currentPath2), `g`);
    str = str.replace(currentRegex2, `$SNIP`);

    stack.pop();
  }
  return str;
}

// Takes an Error and returns a sanitized JSON String
export function sanitizeError(error: Error, pathSeparator: string = sep): string {
  // Hack because Node
  error = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

  // Removes all user paths
  const errorString = cleanPaths(JSON.stringify(error), pathSeparator);

  return JSON.parse(errorString);
}
