import { IconsProps } from '@storybook/components';
import { ArgType } from '@storybook/api';

export type ToolbarShortcutType = 'next' | 'previous' | 'toggle';
export interface ToolbarShortcutConfig {
  label: string;
  keys: string[];
}

export type ToolbarShortcuts = Record<ToolbarShortcutType, ToolbarShortcutConfig>;

export interface ToolbarItem {
  value: string;
  icon?: IconsProps['icon'];
  left?: string;
  right?: string;
  shortcuts?: ToolbarShortcuts;
  title?: string;
}

export interface NormalizedToolbarConfig {
  icon?: IconsProps['icon'];
  items: ToolbarItem[];
  showName?: boolean;
  toggle?: boolean;
}

export type NormalizedToolbarArgType = ArgType & {
  toolbar: NormalizedToolbarConfig;
};

export type ToolbarConfig = NormalizedToolbarConfig & {
  items: string[] | ToolbarItem[];
};

export type ToolbarArgType = ArgType & {
  toolbar: ToolbarConfig;
};
