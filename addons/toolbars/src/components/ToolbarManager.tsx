import React, { useRef } from 'react';
import { uniqueId } from 'lodash';
import { useGlobalTypes } from '@storybook/api';
import { Separator } from '@storybook/components';
import { ToolbarMenuList } from './ToolbarMenuList';
import { ToolbarMenuToggle } from './ToolbarMenuToggle';
import { ID } from '../constants';

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
export const ToolbarManager = () => {
  const idRef = useRef(uniqueId(ID));
  const globalTypes = useGlobalTypes();
  const keys = Object.keys(globalTypes).filter((key) => !!globalTypes[key].toolbar);
  if (!keys.length) return null;

  return (
    <>
      <Separator />
      {keys.map((key) => {
        const normalizedConfig = normalize(key, globalTypes[key] as ToolbarArgType);
        const isToggle = normalizedConfig.toolbar.toggle === true;

        return isToggle ? (
          <ToolbarMenuToggle key={key} id={`${idRef.current}-${key}`} {...normalizedConfig} />
        ) : (
          <ToolbarMenuList key={key} id={`${idRef.current}-${key}`} {...normalizedConfig} />
        );
      })}
    </>
  );
};
