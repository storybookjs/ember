import React, { FC, Context, createContext, useEffect, useState } from 'react';
import deepEqual from 'fast-deep-equal';
import { addons } from '@storybook/addons';
import type { SyntaxHighlighterFormatTypes } from '@storybook/components';
import type { StoryId } from '@storybook/api';
import { SNIPPET_RENDERED } from '../shared';

export interface SourceItem {
  code: string;
  format: SyntaxHighlighterFormatTypes;
}
export type StorySources = Record<StoryId, SourceItem>;

export interface SourceContextProps {
  sources: StorySources;
  setSource?: (id: StoryId, item: SourceItem) => void;
}

export const SourceContext: Context<SourceContextProps> = createContext({ sources: {} });

export const SourceContainer: FC<{}> = ({ children }) => {
  const [sources, setSources] = useState<StorySources>({});
  const channel = addons.getChannel();

  useEffect(() => {
    const handleSnippetRendered = (
      id: StoryId,
      newSource: string,
      format: SyntaxHighlighterFormatTypes = false
    ) => {
      // optimization: if the source is the same, ignore the incoming event
      if (sources[id] && sources[id].code === newSource) {
        return;
      }

      setSources((current) => {
        const newSources = {
          ...current,
          [id]: { code: newSource, format },
        };

        if (!deepEqual(current, newSources)) {
          return newSources;
        }
        return current;
      });
    };

    channel.on(SNIPPET_RENDERED, handleSnippetRendered);

    return () => channel.off(SNIPPET_RENDERED, handleSnippetRendered);
  }, []);

  return <SourceContext.Provider value={{ sources }}>{children}</SourceContext.Provider>;
};
