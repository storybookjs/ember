import fs from 'fs';
import { resolve } from 'path';
import type { StoriesEntry, NormalizedStoriesEntry } from '../types';

const DEFAULT_FILES = '*.stories.@(mdx|tsx|ts|jsx|js)';
const DEFAULT_TITLE_PREFIX = '';

const isDirectory = (configDir: string, entry: string) => {
  try {
    return fs.lstatSync(resolve(configDir, entry)).isDirectory();
  } catch (err) {
    return false;
  }
};

export const normalizeStoriesEntry = (
  entry: StoriesEntry,
  configDir: string
): NormalizedStoriesEntry => {
  let glob;
  let directory;
  let files;
  let titlePrefix;
  if (typeof entry === 'string') {
    if (!entry.includes('**') && isDirectory(configDir, entry)) {
      directory = entry;
      titlePrefix = DEFAULT_TITLE_PREFIX;
      files = DEFAULT_FILES;
    } else {
      glob = entry;
    }
  } else {
    directory = entry.directory;
    files = entry.files || DEFAULT_FILES;
    titlePrefix = entry.titlePrefix || DEFAULT_TITLE_PREFIX;
  }
  if (typeof glob !== 'undefined') {
    return { glob, specifier: undefined };
  }
  return { glob: `${directory}/**/${files}`, specifier: { directory, titlePrefix, files } };
};

export const normalizeStories = (entries: StoriesEntry[], configDir: string) =>
  entries.map((entry) => normalizeStoriesEntry(entry, configDir));
