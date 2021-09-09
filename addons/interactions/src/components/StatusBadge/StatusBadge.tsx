import React from 'react';
import { styled, typography } from '@storybook/theming';
import { CallState, CallStates } from '../../types';

export interface StatusBadgeProps {
  status: CallState;
}

const StyledBadge = styled.div<StatusBadgeProps>(({ theme, status }) => {
  const backgroundColor = {
    [CallStates.DONE]: theme.color.positive,
    [CallStates.ERROR]: theme.color.negative,
    [CallStates.PENDING]: theme.color.warning,
  }[status];
  return {
    padding: '4px 6px 4px 8px;',
    borderRadius: '4px',
    backgroundColor,
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
    [CallStates.DONE]: 'Pass',
    [CallStates.ERROR]: 'Fail',
    [CallStates.PENDING]: 'Runs',
  }[status];
  return <StyledBadge status={status}>{badgeText}</StyledBadge>;
};
