import React from 'react';
import { styled, typography } from '@storybook/theming';
import { CallState } from '../../types';

export interface StatusBadgeProps {
  status: `${CallState}`;
}

const StyledBadge = styled.div<StatusBadgeProps>(({ theme, status }) => {
  const backgroundColor = {
    [CallState.DONE]: theme.color.positive,
    [CallState.ERROR]: theme.color.negative,
    [CallState.PENDING]: theme.color.warning,
  }[status];
  return {
    padding: '4px 6px 4px 8px;',
    borderRadius: '4px',
    backgroundColor: backgroundColor,
    color: 'white',
    fontFamily: typography.fonts.base,
    textTransform: 'uppercase',
    fontSize: typography.size.s1,
    letterSpacing: 3,
    fontWeight: typography.weight.bold,
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
