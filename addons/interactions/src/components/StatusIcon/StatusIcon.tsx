import React from 'react';
import { Icons, IconsProps } from '@storybook/components';
import { styled } from '@storybook/theming';

import { CallStates } from '@storybook/instrumenter';
import localTheme from '../../theme';

export interface StatusIconProps extends IconsProps {
  status: CallStates;
}

const {
  colors: {
    pure: { gray },
  },
} = localTheme;

const StyledStatusIcon = styled(Icons)<StatusIconProps>(({ theme, status }) => {
  const color = {
    [CallStates.DONE]: theme.color.positive,
    [CallStates.ERROR]: theme.color.negative,
    [CallStates.ACTIVE]: theme.color.secondary,
    [CallStates.WAITING]: gray[500],
  }[status];
  return {
    width: status === CallStates.WAITING ? 6 : 12,
    height: status === CallStates.WAITING ? 6 : 12,
    color,
    justifySelf: 'center',
  };
});

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const icon = {
    [CallStates.DONE]: 'check',
    [CallStates.ERROR]: 'stopalt',
    [CallStates.ACTIVE]: 'play',
    [CallStates.WAITING]: 'circle',
  }[status] as IconsProps['icon'];
  return <StyledStatusIcon status={status} icon={icon} />;
};
