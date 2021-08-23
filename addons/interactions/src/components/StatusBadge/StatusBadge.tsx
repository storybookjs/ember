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

const StyledBadge = styled.div(({ status }: StatusBadgeProps) => {
  const backgroundColor = {
    [TestingStates.DONE]: green,
    [TestingStates.ERROR]: red,
    [TestingStates.PENDING]: ochre,
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
    [TestingStates.DONE]: 'Pass',
    [TestingStates.ERROR]: 'Fail',
    [TestingStates.PENDING]: 'Runs',
  }[status];
  return <StyledBadge status={status}>{badgeText}</StyledBadge>;
};
