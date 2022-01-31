import type { ReactNode } from 'react';

export interface SyntaxHighlighterRendererProps {
  rows: any[];
  stylesheet: string;
  useInlineStyles: boolean;
}

export interface SyntaxHighlighterProps {
  language: string;
  copyable?: boolean;
  bordered?: boolean;
  padded?: boolean;
  format?: boolean;
  className?: string;
  renderer?: (props: SyntaxHighlighterRendererProps) => ReactNode;
}
