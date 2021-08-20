import React from 'react';
import { Icons, IconsProps } from '@storybook/components';
import { styled } from '@storybook/theming';
import { TestState, TestingStates } from '../../Panel';
import { theme } from '../../theme';

export interface StatusIconProps extends IconsProps {
  status: TestState;
}

const {
  colors: {
    pure: { green, red, gray },
  },
} = theme;

const StyledStatusIcon = styled(Icons)(({ status }: StatusIconProps) => ({
  width: status === TestingStates.PENDING ? 6 : 12,
  height: status === TestingStates.PENDING ? 6 : 12,
  color: status === TestingStates.PENDING ? gray[500] : status === TestingStates.DONE ? green : red,
  justifySelf: 'center',
}));

/**
 * StatusIcon
 * @param status: StatusIconProps
 * @returns styled icon based on status
 */
export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  // TODO: update when stop icon is added to design library
  const icon = status === TestingStates.PENDING ? 'circle' : 'check';
  if (status === TestingStates.ERROR)
    return (
      <span
        style={{
          display: 'block',
          width: 10,
          height: 10,
          background: red,
          borderRadius: 1,
          justifySelf: 'center',
        }}
      />
    );
  return <StyledStatusIcon status={status} icon={icon} />;
};
