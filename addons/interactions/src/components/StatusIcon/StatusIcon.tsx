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
    pure: { gray },
  },
} = theme;

const StyledStatusIcon = styled(Icons)<StatusIconProps>(({ theme, status }) => ({
  width: status === CallState.PENDING ? 6 : 12,
  height: status === CallState.PENDING ? 6 : 12,
  color:
    status === CallState.PENDING
      ? gray[500]
      : status === CallState.DONE
      ? theme.color.positive
      : theme.color.negative,
  justifySelf: 'center',
}));

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const icon = {
    [CallState.DONE]: 'check',
    [CallState.PENDING]: 'circle',
    [CallState.ERROR]: 'stopalt',
  }[status] as IconsProps['icon'];
  return <StyledStatusIcon status={status} icon={icon} />;
};
