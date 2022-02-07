import React, { ComponentProps, Suspense, lazy } from 'react';

const LazySyntaxHighlighter = lazy(() => import('./syntaxhighlighter'));

export const SyntaxHighlighter = (props: ComponentProps<typeof LazySyntaxHighlighter>) => (
  <Suspense fallback={<div />}>
    <LazySyntaxHighlighter {...props} />
  </Suspense>
);
