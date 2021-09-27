import stable from 'stable';
import { Comparator } from '@storybook/addons';
import { storySort } from './storySort';

export const sortStories = (stories: any[], storySortParameter: any, fileNameOrder: string[]) => {
  if (storySortParameter) {
    let sortFn: Comparator<any>;
    if (typeof storySortParameter === 'function') {
      sortFn = storySortParameter;
    } else {
      sortFn = storySort(storySortParameter);
    }
    stable.inplace(stories, sortFn);
  } else {
    stable.inplace(
      stories,
      (s1, s2) =>
        fileNameOrder.indexOf(s1[1].importPath || s1[1].parameters.fileName) -
        fileNameOrder.indexOf(s2[1].importPath || s2[1].parameters.fileName)
    );
  }
};
