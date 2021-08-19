import { Context, createContext } from 'react';
import { window as globalWindow } from 'global';

import { DocsContextProps } from '@storybook/store';

export type { DocsContextProps };

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

// TODO -- how to parameterize this by <StoryFnReturnType>
export const DocsContext: Context<DocsContextProps<any>> = globalWindow.__DOCS_CONTEXT__;
