import { ToolbarItem } from '../types';

interface GetSelectedIconProps {
  currentValue: string | null;
  items: ToolbarItem[];
}

export const getSelectedIcon = ({ currentValue, items }: GetSelectedIconProps) => {
  const selectedItem = currentValue != null && items.find((item) => item.value === currentValue);
  const selectedIcon = selectedItem && selectedItem.icon;

  return selectedIcon;
};
