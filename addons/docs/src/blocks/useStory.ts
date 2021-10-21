import { useState, useEffect } from 'react';
import { StoryId, AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';

import { DocsContextProps } from './DocsContext';

export function useStory<TFramework extends AnyFramework = AnyFramework>(
  storyId: StoryId,
  context: DocsContextProps<TFramework>
): Story<TFramework> | void {
  const stories = useStories([storyId], context);
  return stories && stories[0];
}

export function useStories<TFramework extends AnyFramework = AnyFramework>(
  storyIds: StoryId[],
  context: DocsContextProps<TFramework>
): (Story<TFramework> | void)[] {
  const [storiesById, setStories] = useState({} as Record<StoryId, Story<TFramework>>);

  useEffect(() => {
    Promise.all(
      storyIds.map(async (storyId) => {
        const story = await context.loadStory(storyId);
        setStories((current) => ({ ...current, [storyId]: story }));
      })
    );
  }, storyIds);

  return storyIds.map((storyId) => storiesById[storyId]);
}
