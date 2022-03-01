import slash from 'slash';

// FIXME: types duplicated type from `core-common', to be
// removed when we remove v6 back-compat.
interface NormalizedStoriesSpecifier {
  titlePrefix?: string;
  directory: string;
  files?: string;
  importPathMatcher: RegExp;
}

const stripExtension = (path: string[]) => {
  let parts = [...path];
  const last = parts[parts.length - 1];
  const dotIndex = last.indexOf('.');
  const stripped = dotIndex > 0 ? last.substr(0, dotIndex) : last;
  parts[parts.length - 1] = stripped;
  const [first, ...rest] = parts;
  if (first === '') {
    parts = rest;
  }
  return parts;
};

const indexRe = /^index$/i;

// deal with files like "atoms/button/{button,index}.stories.js"
const removeRedundantFilename = (paths: string[]) => {
  let prevVal: string;
  return paths.filter((val, index) => {
    if (index === paths.length - 1 && (val === prevVal || indexRe.test(val))) {
      return false;
    }
    prevVal = val;
    return true;
  });
};

/**
 * Combines path parts together, without duplicating separators (slashes).  Used instead of `path.join`
 * because this code runs in the browser.
 *
 * @param paths array of paths to join together.
 * @returns joined path string, with single '/' between parts
 */
function pathJoin(paths: string[]): string {
  const slashes = new RegExp('/{1,}', 'g');
  return paths.join('/').replace(slashes, '/');
}

export const autoTitleFromSpecifier = (fileName: string, entry: NormalizedStoriesSpecifier) => {
  const { directory, importPathMatcher, titlePrefix = '' } = entry || {};
  // On Windows, backslashes are used in paths, which can cause problems here
  // slash makes sure we always handle paths with unix-style forward slash
  const normalizedFileName = slash(fileName);

  if (importPathMatcher.exec(normalizedFileName)) {
    const suffix = normalizedFileName.replace(directory, '');
    const titleAndSuffix = slash(pathJoin([titlePrefix, suffix]));
    let path = titleAndSuffix.split('/');
    path = stripExtension(path);
    path = removeRedundantFilename(path);
    return path.join('/');
  }
  return undefined;
};

export const autoTitle = (fileName: string, storiesEntries: NormalizedStoriesSpecifier[]) => {
  for (let i = 0; i < storiesEntries.length; i += 1) {
    const title = autoTitleFromSpecifier(fileName, storiesEntries[i]);
    if (title) return title;
  }
  return undefined;
};
