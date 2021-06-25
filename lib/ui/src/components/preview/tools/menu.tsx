import React from 'react';
import { Separator } from '@storybook/components';
import { Consumer, Combo } from '@storybook/api';
import { Addon } from '@storybook/addons';
import { useMenu } from '../../../containers/menu';
import { ToolbarMenu } from '../../sidebar/Menu';

const menuMapper = ({ api, state }: Combo) => ({
  isVisible: state.layout.showNav,
  menu: useMenu(
    api,
    state.layout.isToolshown,
    state.layout.isFullscreen,
    state.layout.showPanel,
    state.layout.showNav,
    state.ui.enableShortcuts
  ),
});

export const menuTool: Addon = {
  title: 'menu',
  id: 'menu',
  match: ({ viewMode }) => viewMode === 'story',
  render: () => (
    <>
      <Consumer filter={menuMapper}>
        {({ isVisible, menu }) =>
          isVisible ? null : (
            <>
              <ToolbarMenu menu={menu} />
              <Separator />
            </>
          )
        }
      </Consumer>
    </>
  ),
};
