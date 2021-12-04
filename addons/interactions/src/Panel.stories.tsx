import React from 'react';
import { action } from '@storybook/addon-actions';
import { ComponentStoryObj, ComponentMeta } from '@storybook/react';
import { CallStates } from '@storybook/instrumenter';
import { styled } from '@storybook/theming';

import { getCall } from './mocks';
import { AddonPanelPure } from './Panel';
import SubnavStories from './components/Subnav/Subnav.stories';

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
    controls: SubnavStories.args.controls,
    controlStates: SubnavStories.args.controlStates,
    interactions: [getCall(CallStates.DONE)],
    fileName: 'addon-interactions.stories.tsx',
    hasException: false,
    isPlaying: false,
    onScrollToEnd: action('onScrollToEnd'),
    endRef: null,
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
    controlStates: {
      debugger: true,
      start: false,
      back: false,
      goto: true,
      next: true,
      end: true,
    },
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
  args: { controlStates: { ...SubnavStories.args.controlStates, debugger: false } },
};

export const NoInteractions: Story = {
  args: {
    interactions: [],
  },
};
