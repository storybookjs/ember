import fs from 'fs';
import { resolve } from 'path';
import type { StoriesEntry, NormalizedStoriesEntry } from '../types';

const DEFAULT_FILES = '*.stories.@(mdx|tsx|ts|jsx|js)';
const DEFAULT_ROOT = '';

export const normalizeStoriesEntry = (
  entry: StoriesEntry,
  configDir: string
): NormalizedStoriesEntry => {
  let glob;
  let directory;
  let files;
  let root;
  if (typeof entry === 'string') {
    if (!entry.includes('**') && fs.lstatSync(resolve(configDir, entry)).isDirectory()) {
      directory = entry;
      root = DEFAULT_ROOT;
      files = DEFAULT_FILES;
    } else {
      glob = entry;
    }
  } else {
    directory = entry.directory;
    files = entry.files || DEFAULT_FILES;
    root = entry.root || DEFAULT_ROOT;
  }
  if (typeof glob !== 'undefined') {
    return { glob, specifier: undefined };
  }
  return { glob: `${directory}/**/${files}`, specifier: { directory, root, files } };
};

export const normalizeStories = (entries: StoriesEntry[], configDir: string) =>
  entries.map((entry) => normalizeStoriesEntry(entry, configDir));
