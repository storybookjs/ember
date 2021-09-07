import type { NormalizedStoriesEntry } from '@storybook/core-common';
import global from 'global';
import startCase from 'lodash/startCase';
import path from 'path';
import slash from 'slash';

const { FEATURES = {}, STORIES = [] } = global;

interface Meta {
  title?: string;
}

const autoTitleV2 = (meta: Meta, fileName: string) => {
  return meta.title;
};

const stripExtension = (titleWithExtension: string) => {
  let parts = titleWithExtension.split('/');
  const last = parts[parts.length - 1];
  const dotIndex = last.indexOf('.');
  const stripped = dotIndex > 0 ? last.substr(0, dotIndex) : last;
  parts[parts.length - 1] = stripped;
  const [first, ...rest] = parts;
  if (first === '') {
    parts = rest;
  }
  return parts.join('/');
};

const startCaseTitle = (title: string) => {
  return title.split('/').map(startCase).join('/');
};

export const autoTitleFromEntry = (fileName: string, entry: NormalizedStoriesEntry) => {
  const { directory, titlePrefix = '' } = entry.specifier || {};
  // On Windows, backslashes are used in paths, which can cause problems here
  // slash makes sure we always handle paths with unix-style forward slash
  const normalizedDirectory = directory && slash(directory);
  const normalizedFileName = slash(fileName);

  if (normalizedFileName.startsWith(normalizedDirectory)) {
    const suffix = normalizedFileName.replace(normalizedDirectory, '');
    const titleAndSuffix = slash(path.join(titlePrefix, suffix));
    return startCaseTitle(stripExtension(titleAndSuffix));
  }
  return undefined;
};

const autoTitleV3 = (meta: Meta, fileName: string) => {
  if (meta.title) return meta.title;
  for (let i = 0; i < STORIES.length; i += 1) {
    const title = autoTitleFromEntry(fileName, STORIES[i]);
    if (title) return title;
  }
  return undefined;
};

export const autoTitle = FEATURES.previewCsfV3 ? autoTitleV3 : autoTitleV2;
