import React from 'react';
import { styled, typography } from '@storybook/theming';
import { CallState } from '../../types';
import { theme } from '../../theme';

export interface StatusBadgeProps {
  status: `${CallState}`;
}
const {
  colors: {
    pure: { green, red, ochre },
  },
} = theme;

const StyledBadge = styled.div(({ status }: StatusBadgeProps) => {
  const backgroundColor = {
    [CallState.DONE]: green,
    [CallState.ERROR]: red,
    [CallState.PENDING]: ochre,
  }[status];
  return {
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: backgroundColor,
    color: 'white',
    fontFamily: typography.fonts.base,
    textTransform: 'uppercase',
    fontSize: typography.size.s1,
    letterSpacing: 3,
    fontWeight: 500,
    width: 65,
    textAlign: 'center',
  };
});

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeText = {
    [CallState.DONE]: 'Pass',
    [CallState.ERROR]: 'Fail',
    [CallState.PENDING]: 'Runs',
  }[status];
  return <StyledBadge status={status}>{badgeText}</StyledBadge>;
};
