import React from 'react';
import { styled, useTheme, Theme } from '@storybook/theming';
import { useGlobals } from '@storybook/api';
import { Icons, IconButton, WithTooltip, TooltipLinkList, TabButton } from '@storybook/components';
import { NormalizedToolbarArgType } from '../types';

export type MenuToolbarProps = NormalizedToolbarArgType & { id: string };

export const ToolbarMenuList = ({
  id,
  name,
  description,
  toolbar: { icon, items, showName },
}: MenuToolbarProps) => {
  const [globals, updateGlobals] = useGlobals();
  const theme = useTheme<Theme>();
  const selectedValue = globals[id];
  const active = selectedValue != null;
  const selectedItem = active && items.find((item) => item.value === selectedValue);
  const selectedIcon = (selectedItem && selectedItem.icon) || icon;

  return (
    <Wrapper
      placement="top"
      trigger="click"
      tooltip={({ onHide }) => {
        const links = items.map(({ value, left: _left, title, right: _right, icon: _icon }) => {
          let left: React.ReactNode = _left;
          let right: React.ReactNode = _right;
          const Icon = <Icons fill={theme.color.defaultText} style={{ opacity: 1 }} icon={_icon} />;

          // If title or left is provided, then set icon to right and vice versa
          if (left || title) {
            right = Icon;
          } else if (right) {
            left = Icon;
          }

          return {
            id: value,
            left,
            title,
            right,
            active: selectedValue === value,
            onClick: () => {
              updateGlobals({ [id]: value });
              onHide();
            },
          };
        });
        return <TooltipLinkList links={links} />;
      }}
      closeOnClick
    >
      {selectedIcon ? (
        <IconButton key={name} active={active} title={description}>
          <Icons icon={selectedIcon} />
          {showName ? `\xa0${name}` : null}
        </IconButton>
      ) : (
        <TabButton active={active}>{name}</TabButton>
      )}
    </Wrapper>
  );
};

const Wrapper = styled(WithTooltip)({
  '& a span > svg': {
    opacity: 1,
  },
});
