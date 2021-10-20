import React, { AnchorHTMLAttributes, ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { styled, isPropValid } from '@storybook/theming';
import { transparentize } from 'polished';

interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  href?: void;
}
interface LinkProps
  extends DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
  href: string;
}

const ButtonOrLink = ({ children, ...restProps }: ButtonProps | LinkProps) =>
  restProps.href != null ? (
    <a {...(restProps as LinkProps)}>{children}</a>
  ) : (
    <button type="button" {...(restProps as ButtonProps)}>
      {children}
    </button>
  );

export interface TabButtonProps {
  active?: boolean;
  textColor?: string;
}

export const TabButton = styled(ButtonOrLink, { shouldForwardProp: isPropValid })<TabButtonProps>(
  {
    whiteSpace: 'normal',
    display: 'inline-flex',
    overflow: 'hidden',
    verticalAlign: 'top',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    textDecoration: 'none',

    '&:empty': {
      display: 'none',
    },
  },
  ({ theme }) => ({
    padding: '0 15px',
    transition: 'color 0.2s linear, border-bottom-color 0.2s linear',
    height: 40,
    lineHeight: '12px',
    cursor: 'pointer',
    background: 'transparent',
    border: '0 solid transparent',
    borderTop: '3px solid transparent',
    borderBottom: '3px solid transparent',
    fontWeight: 'bold',
    fontSize: 13,

    '&:focus': {
      outline: '0 none',
      borderBottomColor: theme.color.secondary,
    },
  }),
  ({ active, textColor, theme }) =>
    active
      ? {
          color: textColor || theme.barSelectedColor,
          borderBottomColor: theme.barSelectedColor,
        }
      : {
          color: textColor || theme.barTextColor,
          borderBottomColor: 'transparent',
        }
);
TabButton.displayName = 'TabButton';

export interface IconButtonProps {
  active?: boolean;
}

export const IconButton = styled(ButtonOrLink, { shouldForwardProp: isPropValid })<IconButtonProps>(
  ({ theme }) => ({
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    marginTop: 8,
    padding: '6px 5px',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'inherit',
    cursor: 'pointer',

    // Icon Buttons may have text depending on user preferences.
    // While we don't recommend having text for IconButtons, this style ensures that the text is the correct size.
    fontWeight: 'bold',
    fontSize: 13,

    // I am unsure we need this transition, but if you want a smooth animation, this works nicely
    // transition: 'all 0.15s ease-in-out',

    '&:hover, &:focus': {
      outline: '0 none',
      background: theme.background.hoverable,
      color: theme.color.secondary,
    },
    '& > svg': {
      width: 14,
    },
  }),
  ({ active, theme }) =>
    active
      ? {
          outline: '0 none',
          backgroundColor: theme.color.secondary,
          color: theme.color.inverseText,

          '&:hover, &:focus': {
            backgroundColor: transparentize(0.1, theme.color.secondary),
            color: theme.color.inverseText,
          },
        }
      : {}
);
IconButton.displayName = 'IconButton';
