import { Context, createContext } from 'react';
import { window as globalWindow } from 'global';

export interface DocsContextProps {
  id?: string;
  kind?: string;
  name?: string;

  /**
   * mdxStoryNameToKey is an MDX-compiler-generated mapping of an MDX story's
   * display name to its story key for ID generation. It's used internally by the `<Story>`
   * and `Preview` doc blocks.
   */
  mdxStoryNameToKey?: Record<string, string>;
  mdxComponentMeta?: any;
  parameters?: any;
  storyStore?: any;
  forceRender?: () => void;
}

// We add DocsContext to window. The reason is that in case DocsContext.ts is
// imported multiple times (maybe once directly, and another time from a minified bundle)
// we will have multiple DocsContext definitions - leading to lost context in
// the React component tree.
// This was specifically a problem with the Vite builder.
/* eslint-disable no-underscore-dangle */
if (globalWindow.__DOCS_CONTEXT__ === undefined) {
  globalWindow.__DOCS_CONTEXT__ = createContext({});
  globalWindow.__DOCS_CONTEXT__.displayName = 'DocsContext';
}

export const DocsContext: Context<DocsContextProps> = globalWindow.__DOCS_CONTEXT__;
