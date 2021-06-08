import { ADDON_ID } from '../constants';

/* eslint-disable import/order */
import type { API } from '@storybook/api';
import type { ToolbarShortcutConfig } from '../types';

interface Shortcuts {
  next: ToolbarShortcutConfig & { action: () => void };
  previous: ToolbarShortcutConfig & { action: () => void };
}

export const registerShortcuts = async (api: API, id: string, shortcuts: Shortcuts) => {
  if (shortcuts && shortcuts.next) {
    await api.setAddonShortcut(ADDON_ID, {
      label: shortcuts.next.label,
      defaultShortcut: shortcuts.next.keys,
      actionName: `${id}:next`,
      action: shortcuts.next.action,
    });
  }

  if (shortcuts && shortcuts.previous) {
    await api.setAddonShortcut(ADDON_ID, {
      label: shortcuts.previous.label,
      defaultShortcut: shortcuts.previous.keys,
      actionName: `${id}:previous`,
      action: shortcuts.previous.action,
    });
  }
};
