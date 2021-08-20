import React from 'react';
import { styled, typography } from '@storybook/theming';
import { TestState, TestingStates } from '../../Panel';
import { theme } from '../../theme';

interface StatusBadgeProps {
  status: TestState;
}
const {
  colors: {
    pure: { green, red, ochre },
  },
} = theme;

const StyledBadge = styled.div(({ status }: StatusBadgeProps) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  background: status === TestingStates.DONE ? green : status === TestingStates.ERROR ? red : ochre,
  color: 'white',
  fontFamily: typography.fonts.base,
  textTransform: 'uppercase',
  fontSize: typography.size.s1,
  letterSpacing: 3,
  fontWeight: 500,
  width: 65,
  textAlign: 'center',
}));

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeText =
    status === TestingStates.ERROR ? 'Fail' : status === TestingStates.DONE ? 'Pass' : 'Runs';
  return <StyledBadge status={status}>{badgeText}</StyledBadge>;
};
