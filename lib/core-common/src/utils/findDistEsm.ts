import path from 'path';
import { sync as findUpSync } from 'find-up';

export const findDistEsm = (cwd: string, relativePath: string) => {
  const packageDir = path.dirname(findUpSync('package.json', { cwd }));
  return path.join(packageDir, 'dist', 'esm', relativePath);
};
