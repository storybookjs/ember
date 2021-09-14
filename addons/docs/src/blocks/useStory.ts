import { useState, useEffect } from 'react';
import { StoryId, AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';

import { DocsContextProps } from './DocsContext';

export function useStory<TFramework extends AnyFramework>(
  storyId: StoryId,
  context: DocsContextProps<TFramework>
): Story<TFramework> | void {
  const stories = useStories([storyId], context);
  return stories && stories[0];
}

export function useStories<TFramework extends AnyFramework>(
  storyIds: StoryId[],
  context: DocsContextProps<TFramework>
): Story<TFramework>[] | void {
  const [stories, setStories] = useState(null);

  useEffect(() => {
    Promise.all(storyIds.map((storyId) => context.loadStory(storyId))).then((loadedStories) => {
      if (!stories) {
        setStories(loadedStories);
      }
    });
  });

  return stories;
}
