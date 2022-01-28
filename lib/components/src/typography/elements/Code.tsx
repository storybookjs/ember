import { styled } from '@storybook/theming';
import React, { Children, ComponentProps } from 'react';
import { StyledSyntaxHighlighter } from '../../blocks/Source';
import { isReactChildString } from '../lib/isReactChildString';
import { codeCommon } from '../lib/common';

const isInlineCodeRegex = /[\n\r]/g;

const DefaultCodeBlock = styled.code(
  ({ theme }) => ({
    // from reset
    fontFamily: theme.typography.fonts.mono,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    display: 'inline-block',
    paddingLeft: 2,
    paddingRight: 2,
    verticalAlign: 'baseline',
    color: 'inherit',
  }),
  codeCommon
);

export const Code = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DefaultCodeBlock>) => {
  const language = (className || '').match(/lang-(\S+)/);
  const childrenArray = Children.toArray(children);
  const isInlineCode = !childrenArray
    .filter(isReactChildString)
    .some((child) => child.match(isInlineCodeRegex));

  if (isInlineCode) {
    return (
      <DefaultCodeBlock {...props} className={className}>
        {childrenArray}
      </DefaultCodeBlock>
    );
  }

  return (
    <StyledSyntaxHighlighter
      bordered
      copyable
      language={language?.[1] ?? 'plaintext'}
      format={false}
      {...props}
    >
      {children}
    </StyledSyntaxHighlighter>
  );
};
