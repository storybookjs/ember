import stable from 'stable';
import { Comparator } from '@storybook/addons';
import { Parameters } from '@storybook/csf';
import { storySort } from './storySort';
import { StoryIndexEntry } from './types';

export const sortStoriesV7 = (
  stories: StoryIndexEntry[],
  storySortParameter: any,
  fileNameOrder: string[]
) => {
  if (storySortParameter) {
    let sortFn: Comparator<any>;
    if (typeof storySortParameter === 'function') {
      sortFn = storySortParameter;
    } else {
      sortFn = storySort({ order: storySortParameter });
    }
    stable.inplace(stories, sortFn);
  } else {
    stable.inplace(
      stories,
      (s1, s2) => fileNameOrder.indexOf(s1.importPath) - fileNameOrder.indexOf(s2.importPath)
    );
  }
};

const toIndexEntry = (story: any): StoryIndexEntry => {
  const { id, title, name, parameters } = story;
  return { id, title, name, importPath: parameters.fileName };
};

export const sortStoriesV6 = (
  stories: [string, any, Parameters, Parameters][],
  storySortParameter: any,
  fileNameOrder: string[]
) => {
  if (storySortParameter && typeof storySortParameter === 'function') {
    stable.inplace(stories, storySortParameter);
    return stories.map((s) => toIndexEntry(s[1]));
  }

  const storiesV7 = stories.map((s) => toIndexEntry(s[1]));
  return sortStoriesV7(storiesV7, storySortParameter, fileNameOrder);
};
