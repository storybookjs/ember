import { useState, useEffect } from 'react';
import { StoryId, AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';

import { DocsContextProps } from './DocsContext';

export function useStory<TFramework extends AnyFramework>(
  storyId: StoryId,
  context: DocsContextProps<TFramework>
): Story<TFramework> | void {
  const [story, setStory] = useState(null);

  useEffect(() => {
    context.loadStory(storyId).then((s) => setStory(s));
  });

  return story;
}
