import React, { useState } from 'react';
import { useChannel, useStorybookApi } from '@storybook/api';
import { Icons, IconButton } from '@storybook/components';
import { ButtonProps } from '@storybook/components/dist/ts3.9/Button/Button';
import { FORCE_REMOUNT } from '@storybook/core-events';
import { styled } from '@storybook/theming';
import { TOOL_ID } from './constants';

interface AnimatedButtonProps extends ButtonProps {
  animating?: boolean;
}
const StyledAnimatedIconButton = styled(IconButton)<AnimatedButtonProps>(
  ({ theme, animating, disabled }) => ({
    opacity: disabled ? 0.5 : 1,
    svg: {
      animation: animating && `${theme.animation.rotate360} 1000ms ease-out`,
    },
  })
);

export const Tool = () => {
  const { id: storyId } = useStorybookApi().getCurrentStoryData() || {};
  const emit = useChannel({});
  const [isAnimating, setIsAnimating] = useState(false);
  const animateAndReplay = () => {
    if (!storyId) return;
    setIsAnimating(true);
    emit(FORCE_REMOUNT, { storyId });
  };

  return (
    <StyledAnimatedIconButton
      key={TOOL_ID}
      title="Rerun interactions"
      onClick={animateAndReplay}
      onAnimationEnd={() => setIsAnimating(false)}
      animating={isAnimating}
      disabled={!storyId}
    >
      <Icons icon="sync" />
    </StyledAnimatedIconButton>
  );
};
