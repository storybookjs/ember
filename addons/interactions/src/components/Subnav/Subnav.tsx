import React, { useState } from 'react';
import { Button, Icons, Separator, P } from '@storybook/components';
import { styled } from '@storybook/theming';
import { CallState } from '../../types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { transparentize } from 'polished';
import { ButtonProps } from '@storybook/components/dist/ts3.9/Button/Button';

const StyledSubnav = styled.nav(({ theme }) => ({
  background: theme.background.app,
  borderBottom: `2px solid ${theme.color.border}`,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 15,
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

export interface SubnavProps {
  status: `${CallState}`;
  onPrevious: () => void;
  onNext: () => void;
  onReplay: () => void;
  goToEnd: () => void;
  storyFileName?: string;
}

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 4,
  padding: 6,
  color: theme.color.mediumdark,
  '&:hover,&:focus-visible': {
    color: theme.color.secondary,
  },
}));

const StyledIconButton = styled(StyledButton)(({ theme }) => ({
  '&:hover,&:focus-visible': {
    background: transparentize(0.9, theme.color.secondary),
  },
}));

interface AnimatedButtonProps extends ButtonProps {
  animating?: boolean;
}
const StyledAnimatedIconButton = styled(StyledIconButton)<AnimatedButtonProps>(
  ({ theme, animating }) => ({
    svg: {
      animation: animating && `${theme.animation.rotate360} 1000ms ease-out`,
    },
  })
);

const StyledSeparator = styled(Separator)({
  marginTop: 0,
});

const StyledLocation = styled(P)(({ theme }) => ({
  color: theme.color.mediumdark,
  justifyContent: 'flex-end',
  textAlign: 'right',
  paddingRight: 15,
}));

const Group = styled.div({
  display: 'flex',
  alignItems: 'center',
  '> *': {
    '&:not(:nth-child(1))': {
      margin: '0px 3px',
    },
  },
});

export const Subnav: React.FC<SubnavProps> = ({
  status,
  onPrevious,
  onNext,
  onReplay,
  goToEnd,
  storyFileName,
}) => {
  const buttonText = status === CallState.ERROR ? 'Jump to error' : 'Jump to end';
  const [isAnimating, setIsAnimating] = useState(false);
  const animateAndReplay = () => {
    setIsAnimating(true);
    onReplay();
  };

  return (
    <StyledSubnav>
      <Group>
        <StatusBadge status={status} />

        <StyledButton onClick={goToEnd}>{buttonText}</StyledButton>

        <StyledSeparator />

        <StyledIconButton containsIcon title="Previous step" onClick={onPrevious}>
          <Icons icon="playback" />
        </StyledIconButton>
        <StyledIconButton containsIcon title="Next step" onClick={onNext}>
          <Icons icon="playnext" />
        </StyledIconButton>
        <StyledAnimatedIconButton
          containsIcon
          title="Replay interactions"
          onClick={animateAndReplay}
          onAnimationEnd={() => setIsAnimating(false)}
          animating={isAnimating}
        >
          <Icons icon="sync" />
        </StyledAnimatedIconButton>
      </Group>
      {storyFileName && (
        <Group>
          <StyledLocation>{storyFileName}</StyledLocation>
        </Group>
      )}
    </StyledSubnav>
  );
};
