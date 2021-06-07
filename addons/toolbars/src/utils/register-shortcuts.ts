import { ADDON_ID } from '../constants';

/* eslint-disable import/order */
import type { API } from '@storybook/api';

interface RegisterShortcutsProps {
  label: string;
  keys: string[];
  actionName: string;
  action: () => void;
}

export const registerShortcuts = async (
  api: API,
  { label, keys: defaultShortcut, actionName, action }: RegisterShortcutsProps
) => {
  await api.setAddonShortcut(ADDON_ID, {
    label,
    defaultShortcut,
    actionName,
    action,
  });
};
