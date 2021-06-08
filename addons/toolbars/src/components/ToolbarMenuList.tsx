import React, { useCallback, FC } from 'react';
import { useGlobals } from '@storybook/api';
import { Icons, WithTooltip, TooltipLinkList } from '@storybook/components';
import { ToolbarMenuButton } from './ToolbarMenuButton';
import { withKeyboardCycle, WithKeyboardCycleProps } from '../hoc/withKeyboardCycle';
import { getSelectedIcon } from '../utils/get-selected-icon';
import { ToolbarMenuProps } from '../types';

type ToolbarMenuListProps = ToolbarMenuProps & WithKeyboardCycleProps;

export const ToolbarMenuList: FC<ToolbarMenuListProps> = withKeyboardCycle(
  ({
    id,
    name,
    description,
    toolbar: { icon: _icon, items, title: _title, showName, preventDynamicIcon },
  }) => {
    const [globals, updateGlobals] = useGlobals();

    const currentValue = globals[id];
    const hasGlobalValue = !!currentValue;
    let icon = _icon;
    let title = _title;

    if (!preventDynamicIcon) {
      icon = getSelectedIcon({ currentValue, items }) || icon;
    }

    // Deprecation support for old "name of global arg used as title"
    if (showName && !title) {
      title = name;
    }

    const handleItemClick = useCallback(
      (value: string) => {
        updateGlobals({ [id]: value });
      },
      [currentValue, updateGlobals]
    );

    return (
      <WithTooltip
        placement="top"
        trigger="click"
        tooltip={({ onHide }) => {
          const links = items
            .filter(({ condition }) => {
              let shouldReturn = true;

              if (condition) {
                shouldReturn = condition(currentValue);
              }

              return shouldReturn;
            })
            .map(
              ({
                value,
                left: _left,
                title: itemTitle,
                right: _right,
                icon: itemIcon,
                hideIcon,
              }) => {
                let left: React.ReactNode = _left;
                let right: React.ReactNode = _right;
                const Icon = <Icons style={{ opacity: 1 }} icon={itemIcon} />;

                // If title or left is provided, then set icon to right and vice versa
                if (itemIcon && (left || itemTitle) && !right && !hideIcon) {
                  right = Icon;
                } else if (itemIcon && right && !left && !hideIcon) {
                  left = Icon;
                }

                return {
                  id: value,
                  left,
                  title: itemTitle,
                  right,
                  active: currentValue === value,
                  onClick: () => {
                    handleItemClick(value);
                    onHide();
                  },
                };
              }
            );
          return <TooltipLinkList links={links} />;
        }}
        closeOnClick
      >
        <ToolbarMenuButton
          active={hasGlobalValue}
          description={description}
          icon={icon}
          title={title}
        />
      </WithTooltip>
    );
  }
);
