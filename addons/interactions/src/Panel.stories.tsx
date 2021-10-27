import React from 'react';
import { ComponentStoryObj, ComponentMeta } from '@storybook/react';
import { CallStates } from '@storybook/instrumenter';
import { styled } from '@storybook/theming';

import { getCall } from './mocks';
import { AddonPanelPure } from './Panel';

const StyledWrapper = styled.div(({ theme }) => ({
  backgroundColor: theme.background.content,
  color: theme.color.defaultText,
  display: 'block',
  height: '100%',
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'auto',
}));

export default {
  title: 'Addons/Interactions/Panel',
  component: AddonPanelPure,
  decorators: [
    (Story: any) => (
      <StyledWrapper id="panel-tab-content">
        <Story />
      </StyledWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    calls: new Map(),
    endRef: null,
    fileName: 'addon-interactions.stories.tsx',
    hasException: false,
    hasNext: false,
    hasPrevious: true,
    interactions: [getCall(CallStates.DONE)],
    isDisabled: false,
    isPlaying: false,
    showTabIcon: false,
    isDebuggingEnabled: true,
    // prop for the AddonPanel used as wrapper of Panel
    active: true,
  },
} as ComponentMeta<typeof AddonPanelPure>;

type Story = ComponentStoryObj<typeof AddonPanelPure>;

export const Passing: Story = {
  args: {
    interactions: [getCall(CallStates.DONE)],
  },
};

export const Paused: Story = {
  args: {
    isPlaying: true,
    interactions: [getCall(CallStates.WAITING)],
  },
};

export const Playing: Story = {
  args: {
    isPlaying: true,
    interactions: [getCall(CallStates.ACTIVE)],
  },
};

export const Failed: Story = {
  args: {
    hasException: true,
    interactions: [getCall(CallStates.ERROR)],
  },
};

export const WithDebuggingDisabled: Story = {
  args: { isDebuggingEnabled: false },
};

export const NoInteractions: Story = {
  args: {
    interactions: [],
  },
};
