import React, { memo, useCallback, useEffect } from 'react';
import { useGlobals, useStorybookApi } from '@storybook/api';
import { Icons, IconButton } from '@storybook/components';
import { ADDON_ID, PARAM_KEY } from './constants';

export const OutlineSelector = memo(() => {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();

  const isActive = globals[PARAM_KEY] || false;

  const toggleOutline = useCallback(
    () =>
      updateGlobals({
        [PARAM_KEY]: !isActive,
      }),
    [isActive]
  );

  useEffect(() => {
    api.setAddonShortcut(ADDON_ID, {
      label: 'Toggle Measure [O]',
      defaultShortcut: ['O'],
      actionName: 'outline',
      showInMenu: false,
      action: toggleOutline,
    });
  }, [toggleOutline, api]);

  return (
    <IconButton
      key="outline"
      active={isActive}
      title="Apply outlines to the preview"
      onClick={toggleOutline}
    >
      <Icons icon="outline" />
    </IconButton>
  );
});
