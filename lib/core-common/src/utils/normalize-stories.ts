import fs from 'fs';
import path from 'path';
import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import { scan } from 'picomatch';
import slash from 'slash';

import type { StoriesEntry, NormalizedStoriesSpecifier } from '../types';
import { normalizeStoryPath } from './paths';
import { globToRegexp } from './glob-to-regexp';

const DEFAULT_TITLE_PREFIX = '';
const DEFAULT_FILES = '**/*.stories.@(mdx|tsx|ts|jsx|js)';

// LEGACY support for bad glob patterns we had in SB 5 - remove in SB7
const fixBadGlob = deprecate(
  (match: RegExpMatchArray) => {
    return match.input.replace(match[1], `@${match[1]}`);
  },
  dedent`
    You have specified an invalid glob, we've attempted to fix it, please ensure that the glob you specify is valid. See: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#correct-globs-in-mainjs
  `
);
const detectBadGlob = (val: string) => {
  const match = val.match(/\.(\([^)]+\))/);

  if (match) {
    return fixBadGlob(match);
  }

  return val;
};

const isDirectory = (configDir: string, entry: string) => {
  try {
    return fs.lstatSync(path.resolve(configDir, entry)).isDirectory();
  } catch (err) {
    return false;
  }
};

export const getDirectoryFromWorkingDir = ({
  configDir,
  workingDir,
  directory,
}: NormalizeOptions & { directory: string }) => {
  const directoryFromConfig = path.resolve(configDir, directory);
  const directoryFromWorking = path.relative(workingDir, directoryFromConfig);

  // relative('/foo', '/foo/src') => 'src'
  // but we want `./src` to match importPaths
  return normalizeStoryPath(directoryFromWorking);
};

export const normalizeStoriesEntry = (
  entry: StoriesEntry,
  { configDir, workingDir }: NormalizeOptions
): NormalizedStoriesSpecifier => {
  let specifierWithoutMatcher: Omit<NormalizedStoriesSpecifier, 'importPathMatcher'>;

  if (typeof entry === 'string') {
    const fixedEntry = detectBadGlob(entry);
    const globResult = scan(fixedEntry);
    if (globResult.isGlob) {
      const directory = globResult.prefix + globResult.base;
      const files = globResult.glob;

      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory,
        files,
      };
    } else if (isDirectory(configDir, entry)) {
      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory: entry,
        files: DEFAULT_FILES,
      };
    } else {
      specifierWithoutMatcher = {
        titlePrefix: DEFAULT_TITLE_PREFIX,
        directory: path.dirname(entry),
        files: path.basename(entry),
      };
    }
  } else {
    specifierWithoutMatcher = {
      titlePrefix: DEFAULT_TITLE_PREFIX,
      files: DEFAULT_FILES,
      ...entry,
    };
  }

  // We are going to be doing everything with node importPaths which use
  // URL format, i.e. `/` as a separator, so let's make sure we've normalized
  const files = slash(specifierWithoutMatcher.files);

  // At this stage `directory` is relative to `main.js` (the config dir)
  // We want to work relative to the working dir, so we transform it here.
  const { directory: directoryRelativeToConfig } = specifierWithoutMatcher;

  const directory = slash(
    getDirectoryFromWorkingDir({
      configDir,
      workingDir,
      directory: directoryRelativeToConfig,
    })
  ).replace(/\/$/, '');

  // Now make the importFn matcher.
  const importPathMatcher = globToRegexp(`${directory}/${files}`);

  return {
    ...specifierWithoutMatcher,
    directory,
    importPathMatcher,
  };
};

interface NormalizeOptions {
  configDir: string;
  workingDir: string;
}

export const normalizeStories = (entries: StoriesEntry[], options: NormalizeOptions) =>
  entries.map((entry) => normalizeStoriesEntry(entry, options));
