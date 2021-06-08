import React, { useRef } from 'react';
import { useGlobalTypes } from '@storybook/api';
import { Separator } from '@storybook/components';
import { ToolbarMenuList } from './ToolbarMenuList';
import { ToolbarMenuCycle } from './ToolbarMenuCycle';
import { ADDON_ID } from '../constants';

/* eslint-disable import/order */
import type { FC } from 'react';
import type { ToolbarArgType } from '../types';

const normalize = (key: string, argType: ToolbarArgType) => ({
  ...argType,
  name: argType.name || key,
  description: argType.description || key,
  toolbar: {
    ...argType.toolbar,
    items: argType.toolbar.items.map((item) =>
      typeof item === 'string' ? { value: item, title: item } : item
    ),
  },
});

/**
 * A smart component for handling manager-preview interactions.
 */
export const ToolbarManager: FC = () => {
  const globalTypes = useGlobalTypes();
  const globalIds = Object.keys(globalTypes).filter((id) => !!globalTypes[id].toolbar);

  if (!globalIds.length) {
    return null;
  }

  return (
    <>
      <Separator />
      {globalIds.map((id) => {
        const normalizedConfig = normalize(id, globalTypes[id] as ToolbarArgType);
        const isCycle = normalizedConfig.toolbar.cycle === true;

        return isCycle ? (
          <ToolbarMenuCycle key={id} id={id} {...normalizedConfig} />
        ) : (
          <ToolbarMenuList key={id} id={id} {...normalizedConfig} />
        );
      })}
    </>
  );
};
