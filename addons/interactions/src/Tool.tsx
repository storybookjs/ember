import React from 'react';
import { useChannel } from '@storybook/api';
import { Icons, IconButton } from '@storybook/components';
import { EVENTS, TOOL_ID } from './constants';

export const Tool = () => {
  const emit = useChannel({});
  return (
    <IconButton key={TOOL_ID} title="Rerun story" onClick={() => emit(EVENTS.RELOAD)}>
      <Icons icon="sync" />
    </IconButton>
  );
};
