import React, { ComponentProps, Suspense, lazy } from 'react';

const LazySyntaxHighlighter = lazy(() => import('./syntaxhighlighter'));
const LazySyntaxHighlighterWithFormatter = lazy(async () => {
  const [{ SyntaxHighlighter }, { formatter }] = await Promise.all([
    import('./syntaxhighlighter'),
    import('./formatter'),
  ]);

  return {
    default: (props: ComponentProps<typeof LazySyntaxHighlighter>) => (
      <SyntaxHighlighter {...props} formatter={formatter} />
    ),
  };
});

export const SyntaxHighlighter = (props: ComponentProps<typeof LazySyntaxHighlighter>) => (
  <Suspense fallback={<div />}>
    {props.format !== false ? (
      <LazySyntaxHighlighterWithFormatter {...props} />
    ) : (
      <LazySyntaxHighlighter {...props} />
    )}
  </Suspense>
);
