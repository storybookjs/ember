import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobals } from '@storybook/api';
import { Icons, IconButton, TabButton } from '@storybook/components';
import { getSelectedIcon } from '../utils/get-selected-icon';

import type { NormalizedToolbarArgType } from '../types';

export type ToolbarMenuToggleProps = NormalizedToolbarArgType & { id: string };

export const ToolbarMenuToggle = ({
  id,
  name,
  description,
  defaultValue,
  toolbar: { icon, items, showName },
}: ToolbarMenuToggleProps) => {
  const toggleValues = useRef([]);
  const [current, setCurrent] = useState(defaultValue);
  const [globals, updateGlobals] = useGlobals();

  const selectedIcon = getSelectedIcon({ currentValue: globals[id], items }) || icon;
  const hasGlobalValue = globals[id] !== null;

  const handleClick = useCallback(() => {
    const newCurrentIndex = toggleValues.current[0] === current ? 1 : 0;
    const newCurrent = toggleValues.current[newCurrentIndex];

    setCurrent(newCurrent);
  }, [toggleValues, current, setCurrent]);

  useEffect(() => {
    updateGlobals({ [id]: current });
  }, [current, updateGlobals]);

  useEffect(() => {
    // Toggle will only respect the items in index position 0 & 1 and toggle
    // between these internally to set current
    if (items[0] && items[1]) {
      toggleValues.current = [items[0].value, items[1].value];
    }
  }, []);

  let Component: JSX.Element | null = null;

  if (selectedIcon && toggleValues.current.length === 2) {
    Component = (
      <IconButton active={hasGlobalValue} title={description} onClick={handleClick}>
        <Icons icon={selectedIcon} />
        {showName ? `\xa0${name}` : null}
      </IconButton>
    );
  } else if (toggleValues.current.length === 2) {
    Component = (
      <TabButton active={hasGlobalValue} title={description} onClick={handleClick}>
        {name}
      </TabButton>
    );
  }

  return Component;
};
