import global from 'global';
import pick from 'lodash/pick';
import deepEqual from 'fast-deep-equal';
import { themes, ThemeVars } from '@storybook/theming';

import merge from '../lib/merge';
import { State, ModuleFn } from '../index';

const { DOCS_MODE, document } = global;

export type PanelPositions = 'bottom' | 'right';
export type ActiveTabsType = 'sidebar' | 'canvas' | 'addons';
export const ActiveTabs = {
  SIDEBAR: 'sidebar' as 'sidebar',
  CANVAS: 'canvas' as 'canvas',
  ADDONS: 'addons' as 'addons',
};

export interface Layout {
  initialActive: ActiveTabsType;
  isFullscreen: boolean;
  showPanel: boolean;
  panelPosition: PanelPositions;
  showNav: boolean;
  isToolshown: boolean;
}

export interface UI {
  name?: string;
  url?: string;
  enableShortcuts: boolean;
  docsMode: boolean;
}

export interface SubState {
  layout: Layout;
  ui: UI;
  selectedPanel: string | undefined;
  theme: ThemeVars;
}

export interface SubAPI {
  toggleFullscreen: (toggled?: boolean) => void;
  togglePanel: (toggled?: boolean) => void;
  togglePanelPosition: (position?: PanelPositions) => void;
  toggleNav: (toggled?: boolean) => void;
  toggleToolbar: (toggled?: boolean) => void;
  setOptions: (options: any) => void;
}

type PartialSubState = Partial<SubState>;

export interface UIOptions {
  name?: string;
  url?: string;
  goFullScreen: boolean;
  showStoriesPanel: boolean;
  showAddonPanel: boolean;
  addonPanelInRight: boolean;
  theme?: ThemeVars;
  selectedPanel?: string;
}

const defaultState: SubState = {
  ui: {
    enableShortcuts: true,
    docsMode: false,
  },
  layout: {
    initialActive: ActiveTabs.CANVAS,
    isToolshown: !DOCS_MODE,
    isFullscreen: false,
    showPanel: true,
    showNav: true,
    panelPosition: 'bottom',
  },
  selectedPanel: undefined,
  theme: themes.light,
};

export const focusableUIElements = {
  storySearchField: 'storybook-explorer-searchfield',
  storyListMenu: 'storybook-explorer-menu',
  storyPanelRoot: 'storybook-panel-root',
};

export const init: ModuleFn = ({ store, provider }) => {
  const api = {
    toggleFullscreen(toggled?: boolean) {
      return store.setState(
        ({ layout, customQueryParams }: State) => {
          const { showNav } = layout;

          const value = typeof toggled === 'boolean' ? toggled : !layout.isFullscreen;
          const shouldShowNav = showNav === false && value === false;
          const singleStory = customQueryParams.singleStory === 'true';

          return {
            layout: {
              ...layout,
              isFullscreen: value,
              showNav: !singleStory && shouldShowNav ? true : showNav,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    togglePanel(toggled?: boolean) {
      return store.setState(
        ({ layout }: State) => {
          const { showNav, isFullscreen } = layout;

          const value = typeof toggled !== 'undefined' ? toggled : !layout.showPanel;
          const shouldToggleFullScreen = showNav === false && value === false;

          return {
            layout: {
              ...layout,
              showPanel: value,
              isFullscreen: shouldToggleFullScreen ? true : isFullscreen,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    togglePanelPosition(position?: 'bottom' | 'right') {
      if (typeof position !== 'undefined') {
        return store.setState(
          ({ layout }: State) => ({
            layout: {
              ...layout,
              panelPosition: position,
            },
          }),
          { persistence: 'session' }
        );
      }

      return store.setState(
        ({ layout }: State) => ({
          layout: {
            ...layout,
            panelPosition: layout.panelPosition === 'right' ? 'bottom' : 'right',
          },
        }),
        { persistence: 'session' }
      );
    },

    toggleNav(toggled?: boolean) {
      return store.setState(
        ({ customQueryParams, layout }: State) => {
          if (customQueryParams.singleStory === 'true') return { layout };

          const { showPanel, isFullscreen } = layout;
          const value = typeof toggled !== 'undefined' ? toggled : !layout.showNav;
          const shouldToggleFullScreen = showPanel === false && value === false;

          return {
            layout: {
              ...layout,
              showNav: value,
              isFullscreen: shouldToggleFullScreen ? true : isFullscreen,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    toggleToolbar(toggled?: boolean) {
      return store.setState(
        ({ layout }: State) => {
          const value = typeof toggled !== 'undefined' ? toggled : !layout.isToolshown;

          return {
            layout: {
              ...layout,
              isToolshown: value,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    resetLayout() {
      return store.setState(
        ({ layout }: State) => {
          return {
            layout: {
              ...layout,
              showNav: false,
              showPanel: false,
              isFullscreen: false,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    focusOnUIElement(elementId?: string, select?: boolean) {
      if (!elementId) {
        return;
      }
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        if (select) element.select();
      }
    },

    getInitialOptions() {
      const { theme, selectedPanel, ...options } = provider.getConfig();

      return {
        ...defaultState,
        layout: {
          ...defaultState.layout,
          ...pick(options, Object.keys(defaultState.layout)),
        },
        ui: {
          ...defaultState.ui,
          ...pick(options, Object.keys(defaultState.ui)),
        },
        selectedPanel: selectedPanel || defaultState.selectedPanel,
        theme: theme || defaultState.theme,
      };
    },

    setOptions: (options: any) => {
      const { layout, ui, selectedPanel, theme } = store.getState();

      if (options) {
        const updatedLayout = {
          ...layout,
          ...pick(options, Object.keys(layout)),
        };

        const updatedUi = {
          ...ui,
          ...pick(options, Object.keys(ui)),
        };

        const updatedTheme = {
          ...theme,
          ...options.theme,
        };

        const modification: PartialSubState = {};

        if (!deepEqual(ui, updatedUi)) {
          modification.ui = updatedUi;
        }
        if (!deepEqual(layout, updatedLayout)) {
          modification.layout = updatedLayout;
        }
        if (options.selectedPanel && !deepEqual(selectedPanel, options.selectedPanel)) {
          modification.selectedPanel = options.selectedPanel;
        }

        if (Object.keys(modification).length) {
          store.setState(modification, { persistence: 'permanent' });
        }
        if (!deepEqual(theme, updatedTheme)) {
          store.setState({ theme: updatedTheme });
        }
      }
    },
  };

  const persisted = pick(store.getState(), 'layout', 'ui', 'selectedPanel');

  return { api, state: merge(api.getInitialOptions(), persisted) };
};
