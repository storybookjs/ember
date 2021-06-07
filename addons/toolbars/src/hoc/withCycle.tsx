import React, { useRef, useEffect, useCallback } from 'react';
import { useGlobals, useStorybookApi } from '@storybook/api';
import { createCycleValueArray } from '../utils/create-cycle-value-array';
import { registerShortcuts } from '../utils/register-shortcuts';

import type { ToolbarMenuProps } from '../types';

export type WithCycleProps = {
  cycleValues?: string[];
};

export const withCycle = (Component: React.ComponentType<ToolbarMenuProps>) => {
  const WithCycle = (props: ToolbarMenuProps) => {
    const {
      id,
      toolbar: { items, shortcuts },
    } = props;

    const api = useStorybookApi();
    const [globals, updateGlobals] = useGlobals();
    const cycleValues = useRef([]);
    const currentValue = globals[id];

    const setNext = useCallback(() => {
      const values = cycleValues.current;
      const currentIndex = values.indexOf(currentValue);
      const currentIsLast = currentIndex === values.length - 1;

      const newCurrentIndex = currentIsLast ? 0 : currentIndex + 1;
      const newCurrent = cycleValues.current[newCurrentIndex];

      updateGlobals({ [id]: newCurrent });
    }, [currentValue, updateGlobals]);

    const setPrevious = useCallback(() => {
      const values = cycleValues.current;
      const currentIndex = values.indexOf(currentValue);
      const currentIsLast = currentIndex === values.length - 1;

      const newCurrentIndex = currentIsLast ? 0 : currentIndex + 1;
      const newCurrent = cycleValues.current[newCurrentIndex];

      updateGlobals({ [id]: newCurrent });
    }, [currentValue, updateGlobals]);

    useEffect(() => {
      if (shortcuts && shortcuts.next) {
        registerShortcuts(api, {
          ...shortcuts.next,
          actionName: `${id}-next`,
          action: setNext,
        });
      }

      if (shortcuts && shortcuts.previous) {
        registerShortcuts(api, {
          ...shortcuts.previous,
          actionName: `${id}-previous`,
          action: setPrevious,
        });
      }
    }, [setNext, setPrevious]);

    useEffect(() => {
      cycleValues.current = createCycleValueArray(items);
    }, []);

    return <Component cycleValues={cycleValues.current} {...props} />;
  };

  return WithCycle;
};
