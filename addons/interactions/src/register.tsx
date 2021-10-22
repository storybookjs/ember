import { addons, types } from '@storybook/addons';

import { ADDON_ID, TOOL_ID, PANEL_ID } from './constants';
import { Tool } from './Tool';
import { Panel } from './Panel';

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Restart',
    match: ({ viewMode }) => viewMode === 'story',
    render: Tool,
  });

  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Interactions',
    match: ({ viewMode }) => viewMode === 'story',
    render: Panel,
  });
});
