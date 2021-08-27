import React from 'react';
import { Icons, IconsProps } from '@storybook/components';
import { styled } from '@storybook/theming';
import { CallState } from '../../types';
import { theme } from '../../theme';

export interface StatusIconProps extends IconsProps {
  status: `${CallState}`;
}

const {
  colors: {
    pure: { green, red, gray },
  },
} = theme;

const StyledStatusIcon = styled(Icons)(({ status }: StatusIconProps) => ({
  width: status === CallState.PENDING ? 6 : 12,
  height: status === CallState.PENDING ? 6 : 12,
  color: status === CallState.PENDING ? gray[500] : status === CallState.DONE ? green : red,
  justifySelf: 'center',
}));

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  // TODO: update when stop icon is added to design library
  const icon = status === CallState.PENDING ? 'circle' : 'check';
  if (status === CallState.ERROR)
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
