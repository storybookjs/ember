import React, { useRef, useEffect, useCallback } from 'react';
import { useGlobals, useStorybookApi } from '@storybook/api';
import { createCycleValueArray } from '../utils/create-cycle-value-array';
import { registerShortcuts } from '../utils/register-shortcuts';
import { ToolbarMenuProps } from '../types';

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
    }, [cycleValues, currentValue, updateGlobals]);

    const setPrevious = useCallback(() => {
      const values = cycleValues.current;
      const currentIndex = values.indexOf(currentValue);
      const currentIsFirst = currentIndex === 0;

      const newCurrentIndex = currentIsFirst ? values.length - 1 : currentIndex - 1;
      const newCurrent = cycleValues.current[newCurrentIndex];

      updateGlobals({ [id]: newCurrent });
    }, [cycleValues, currentValue, updateGlobals]);

    useEffect(() => {
      if (shortcuts) {
        registerShortcuts(api, id, {
          next: { ...shortcuts.next, action: setNext },
          previous: { ...shortcuts.previous, action: setPrevious },
        });
      }
    }, [api, id, shortcuts, setNext, setPrevious]);

    useEffect(() => {
      cycleValues.current = createCycleValueArray(items);
    }, []);

    return <Component cycleValues={cycleValues.current} {...props} />;
  };

  return WithCycle;
};
