// TODO copied over from core-client ??

import global from 'global';

// TODO
// import type { NormalizedStoriesEntry } from './types';
interface NormalizedStoriesEntrySpecifier {
  directory: string;
  titlePrefix?: string;
}
interface NormalizedStoriesEntry {
  specifier: NormalizedStoriesEntrySpecifier;
}

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

export const autoTitleFromEntry = (fileName: string, entry: NormalizedStoriesEntry) => {
  const { directory, titlePrefix = '' } = entry.specifier || {};
  if (fileName.startsWith(directory)) {
    const suffix = fileName.replace(directory, '');
    return stripExtension([titlePrefix, suffix].join('/'));
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
