import React, { FunctionComponent, ComponentProps } from 'react';
import { styled } from '@storybook/theming';
import { Button } from '@storybook/components';

import { Brand } from './Brand';
import { SidebarMenu, MenuList } from './Menu';

export interface HeadingProps {
  menuHighlighted?: boolean;
  menu: MenuList;
}

const BrandArea = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s2,
  fontWeight: theme.typography.weight.bold,
  color: theme.color.defaultText,
  marginRight: 20,
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  minHeight: 22,

  '& > *': {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    flex: '1 1 auto',
  },
}));

const HeadingWrapper = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
});

const SkipToContentLink = styled(Button)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  padding: '10px 15px',
  fontSize: theme.typography.size.s1,
  zIndex: 1,
  transform: 'translate(0,-100px)',
  '&:focus': {
    transform: 'translate(0,-10px)',
  },
}));

export const Heading: FunctionComponent<HeadingProps & ComponentProps<typeof HeadingWrapper>> = ({
  menuHighlighted = false,
  menu,
  ...props
}) => {
  return (
    <HeadingWrapper {...props}>
      <SkipToContentLink
        secondary
        isLink
        tabIndex={0}
        data-testid="heading--skip"
        href="#storybook-preview-wrapper"
      >
        Skip to canvas
      </SkipToContentLink>

      <BrandArea>
        <Brand />
      </BrandArea>

      <SidebarMenu menu={menu} isHighlighted={menuHighlighted} />
    </HeadingWrapper>
  );
};
