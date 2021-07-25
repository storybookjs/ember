import { ModuleExports, CSFFile } from './types';

// Given the raw exports of a CSF file, check and normalize it.
export function processCSFFile<StoryFnReturnType>(
  exports: ModuleExports
): CSFFile<StoryFnReturnType> {
  // TODO check
  // TODO call normalize CSF

  return exports as CSFFile<StoryFnReturnType>;
}
