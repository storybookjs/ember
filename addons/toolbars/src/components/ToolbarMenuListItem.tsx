import React, { ReactNode } from 'react';
import { Icons } from '@storybook/components';
import { ToolbarItem } from '../types';

interface ListItem {
  id: string;
  left?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

type ToolbarMenuListItemProps = {
  currentValue: string;
  onClick: () => void;
} & ToolbarItem;

export const ToolbarMenuListItem = ({
  left,
  right,
  title,
  value,
  icon,
  hideIcon,
  onClick,
  currentValue,
}: ToolbarMenuListItemProps) => {
  const Icon = <Icons style={{ opacity: 1 }} icon={icon} />;
  const hasContent = left || right || title;

  const Item: ListItem = {
    id: value,
    active: currentValue === value,
    onClick,
  };

  if (left) {
    Item.left = left;
  }

  if (right) {
    Item.right = right;
  }

  if (title) {
    Item.title = title;
  }

  if (icon && !hideIcon) {
    if (hasContent && !right) {
      Item.right = Icon;
    } else if (hasContent && !left) {
      Item.left = Icon;
    } else if (!hasContent) {
      Item.right = Icon;
    }
  }

  return Item;
};
