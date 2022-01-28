import React, { FunctionComponent, AnchorHTMLAttributes } from 'react';

export const Link: FunctionComponent<AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  href: input,
  children,
  ...props
}) => {
  const isStorybookPath = /^\//.test(input);
  const isAnchorUrl = /^#.*/.test(input);
  const href = isStorybookPath ? `?path=${input}` : input;
  const target = isAnchorUrl ? '_self' : '_top';

  return (
    <a href={href} target={target} {...props}>
      {children}
    </a>
  );
};
