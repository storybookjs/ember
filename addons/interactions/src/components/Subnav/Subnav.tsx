import React from 'react';
import {
  Button,
  IconButton,
  Icons,
  Separator,
  P,
  TooltipNote,
  WithTooltip,
  Bar,
} from '@storybook/components';
import { Call, CallStates, ControlStates } from '@storybook/instrumenter';
import { styled } from '@storybook/theming';

import { StatusBadge } from '../StatusBadge/StatusBadge';
import { Controls } from '../../Panel';

const SubnavWrapper = styled.div(({ theme }) => ({
  background: theme.background.app,
  borderBottom: `1px solid ${theme.appBorderColor}`,
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

const StyledSubnav = styled.nav(({ theme }) => ({
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 15,
}));

export interface SubnavProps {
  controls: Controls;
  controlStates: ControlStates;
  status: Call['status'];
  storyFileName?: string;
  onScrollToEnd?: () => void;
}

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 4,
  padding: 6,
  color: theme.textMutedColor,
  '&:not(:disabled)': {
    '&:hover,&:focus-visible': {
      color: theme.color.secondary,
    },
  },
}));

const Note = styled(TooltipNote)(({ theme }) => ({
  fontFamily: theme.typography.fonts.base,
}));

export const StyledIconButton = styled(IconButton as any)(({ theme }) => ({
  color: theme.color.mediumdark,
  margin: '0 3px',
}));

const StyledSeparator = styled(Separator)({
  marginTop: 0,
});

const StyledLocation = styled(P)(({ theme }) => ({
  color: theme.textMutedColor,
  justifyContent: 'flex-end',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  marginTop: 'auto',
  marginBottom: 1,
  paddingRight: 15,
  fontSize: 13,
}));

const Group = styled.div({
  display: 'flex',
  alignItems: 'center',
});

const RewindButton = styled(StyledIconButton)({
  marginLeft: 9,
});

const JumpToEndButton = styled(StyledButton)({
  marginLeft: 9,
  marginRight: 9,
  marginBottom: 1,
  lineHeight: '12px',
});

export const Subnav: React.FC<SubnavProps> = ({
  controls,
  controlStates,
  status,
  storyFileName,
  onScrollToEnd,
}) => {
  const buttonText = status === CallStates.ERROR ? 'Scroll to error' : 'Scroll to end';

  return (
    <SubnavWrapper>
      <Bar>
        <StyledSubnav>
          <Group>
            <StatusBadge status={status} />

            <JumpToEndButton onClick={onScrollToEnd} disabled={!onScrollToEnd}>
              {buttonText}
            </JumpToEndButton>

            <StyledSeparator />

            <WithTooltip hasChrome={false} tooltip={<Note note="Go to start" />}>
              <RewindButton containsIcon onClick={controls.start} disabled={!controlStates.start}>
                <Icons icon="rewind" />
              </RewindButton>
            </WithTooltip>

            <WithTooltip hasChrome={false} tooltip={<Note note="Go back" />}>
              <StyledIconButton containsIcon onClick={controls.back} disabled={!controlStates.back}>
                <Icons icon="playback" />
              </StyledIconButton>
            </WithTooltip>

            <WithTooltip hasChrome={false} tooltip={<Note note="Go forward" />}>
              <StyledIconButton containsIcon onClick={controls.next} disabled={!controlStates.next}>
                <Icons icon="playnext" />
              </StyledIconButton>
            </WithTooltip>

            <WithTooltip hasChrome={false} tooltip={<Note note="Go to end" />}>
              <StyledIconButton containsIcon onClick={controls.end} disabled={!controlStates.end}>
                <Icons icon="fastforward" />
              </StyledIconButton>
            </WithTooltip>
          </Group>
          {storyFileName && (
            <Group>
              <StyledLocation>{storyFileName}</StyledLocation>
            </Group>
          )}
        </StyledSubnav>
      </Bar>
    </SubnavWrapper>
  );
};
