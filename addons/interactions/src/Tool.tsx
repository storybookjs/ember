import React, { useState } from 'react';
import { useChannel } from '@storybook/api';
import { Icons, IconButton } from '@storybook/components';
import { ButtonProps } from '@storybook/components/dist/ts3.9/Button/Button';
import { FORCE_CLEAN_RENDER } from '@storybook/core-events';
import { styled } from '@storybook/theming';
import { TOOL_ID } from './constants';

interface AnimatedButtonProps extends ButtonProps {
  animating?: boolean;
}
const StyledAnimatedIconButton = styled(IconButton)<AnimatedButtonProps>(
  ({ theme, animating }) => ({
    svg: {
      animation: animating && `${theme.animation.rotate360} 1000ms ease-out`,
    },
  })
);

export const Tool = () => {
  const emit = useChannel({});
  const [isAnimating, setIsAnimating] = useState(false);
  const animateAndReplay = () => {
    setIsAnimating(true);
    emit(FORCE_CLEAN_RENDER);
  };

  return (
    <StyledAnimatedIconButton
      key={TOOL_ID}
      title="Rerun interactions"
      onClick={animateAndReplay}
      onAnimationEnd={() => setIsAnimating(false)}
      animating={isAnimating}
    >
      <Icons icon="sync" />
    </StyledAnimatedIconButton>
  );
};
