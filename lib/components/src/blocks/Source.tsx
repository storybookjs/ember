import React, { FunctionComponent } from 'react';
import { styled, ThemeProvider, convert, themes } from '@storybook/theming';
import { EmptyBlock } from './EmptyBlock';

import { SyntaxHighlighter } from '../syntaxhighlighter/lazy-syntaxhighlighter';

const StyledSyntaxHighlighter = styled(SyntaxHighlighter)<{}>(({ theme }) => ({
  // DocBlocks-specific styling and overrides
  fontSize: `${theme.typography.size.s2 - 1}px`,
  lineHeight: '19px',
  margin: '25px 0 40px',
  borderRadius: theme.appBorderRadius,
  boxShadow:
    theme.base === 'light' ? 'rgba(0, 0, 0, 0.10) 0 1px 3px 0' : 'rgba(0, 0, 0, 0.20) 0 2px 5px 0',
  'pre.prismjs': {
    padding: 20,
    background: 'inherit',
  },
}));

export enum SourceError {
  NO_STORY = 'There\u2019s no story here.',
  SOURCE_UNAVAILABLE = 'Oh no! The source is not available.',
}

interface SourceErrorProps {
  isLoading?: boolean;
  error?: SourceError;
}

interface SourceCodeProps {
  language?: string;
  code?: string;
  format?: boolean;
  dark?: boolean;
}

const SourceSkeletonWrapper = styled.div<{}>(({ theme }) => ({
  background: theme.background.content,
  borderRadius: theme.appBorderRadius,
  border: `1px solid ${theme.appBorderColor}`,
  boxShadow:
    theme.base === 'light' ? 'rgba(0, 0, 0, 0.10) 0 1px 3px 0' : 'rgba(0, 0, 0, 0.20) 0 2px 5px 0',
  margin: '25px 0 40px',
  padding: '20px 20px 20px 22px',
}));

const SourceSkeletonPlaceholder = styled.div<{}>(({ theme }) => ({
  animation: `${theme.animation.glow} 1.5s ease-in-out infinite`,
  background: theme.appBorderColor,
  height: 17,
  marginTop: 1,
  width: '60%',

  '&:first-child': {
    margin: 0,
  },
}));

const SourceSkeleton = () => (
  <SourceSkeletonWrapper>
    <SourceSkeletonPlaceholder />
    <SourceSkeletonPlaceholder style={{ width: '80%' }} />
    <SourceSkeletonPlaceholder style={{ width: '30%' }} />
    <SourceSkeletonPlaceholder style={{ width: '80%' }} />
  </SourceSkeletonWrapper>
);

// FIXME: Using | causes a typescript error, so stubbing it with & for now
// and making `error` optional
export type SourceProps = SourceErrorProps & SourceCodeProps;

/**
 * Syntax-highlighted source code for a component (or anything!)
 */
const Source: FunctionComponent<SourceProps> = (props) => {
  const { isLoading, error } = props as SourceErrorProps;
  if (isLoading) {
    return <SourceSkeleton />;
  }
  if (error) {
    return <EmptyBlock>{error}</EmptyBlock>;
  }

  const { language, code, dark, format, ...rest } = props as SourceCodeProps;

  const syntaxHighlighter = (
    <StyledSyntaxHighlighter
      bordered
      copyable
      format={format}
      language={language}
      className="docblock-source"
      {...rest}
    >
      {code}
    </StyledSyntaxHighlighter>
  );
  if (typeof dark === 'undefined') {
    return syntaxHighlighter;
  }
  const overrideTheme = dark ? themes.dark : themes.light;
  return <ThemeProvider theme={convert(overrideTheme)}>{syntaxHighlighter}</ThemeProvider>;
};

Source.defaultProps = {
  format: false,
};
export { Source, StyledSyntaxHighlighter };
