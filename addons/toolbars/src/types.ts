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
  /** The label to show for this toolbar item */
  title?: string;
  /** Choose an icon to show for this toolbar item */
  icon?: IconsProps['icon'];
  /** Set to true to update icon to match any present selected items icon */
  useItemIcon?: boolean;
  items: ToolbarItem[];
  toggle?: boolean;
  /** @deprecated "name" no longer dual purposes as title - use "title" if a title is wanted */
  showName?: boolean;
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
