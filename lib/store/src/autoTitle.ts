import startCase from 'lodash/startCase';
import path from 'path';
import slash from 'slash';

// FIXME: types duplicated type from `core-common', to be
// removed when we remove v6 back-compat.
interface StoriesSpecifier {
  directory: string;
  files?: string;
  titlePrefix?: string;
}

interface NormalizedStoriesSpecifier {
  glob: string;
  specifier?: StoriesSpecifier;
}

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

export const autoTitleFromEntry = (fileName: string, entry: NormalizedStoriesSpecifier) => {
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

export const autoTitle = (fileName: string, storiesEntries: NormalizedStoriesSpecifier[]) => {
  for (let i = 0; i < storiesEntries.length; i += 1) {
    const title = autoTitleFromEntry(fileName, storiesEntries[i]);
    if (title) return title;
  }
  return undefined;
};
