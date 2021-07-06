import qs from 'qs';

import { SET_CURRENT_STORY, GLOBALS_UPDATED } from '@storybook/core-events';
import { navigate as reachNavigate } from '@reach/router';

import { init as initURL } from '../modules/url';

jest.mock('@storybook/client-logger');
jest.mock('@reach/router');
jest.useFakeTimers();

describe('initial state', () => {
  const viewMode = 'story';

  describe('config query parameters', () => {
    it('handles full parameter', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ full: '1' }) };

      const {
        state: { layout },
      } = initURL({ navigate, state: { location } });

      expect(layout).toEqual({ isFullscreen: true });
    });

    it('handles nav parameter', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ nav: '0' }) };

      const {
        state: { layout },
      } = initURL({ navigate, state: { location } });

      expect(layout).toEqual({ showNav: false });
    });

    it('handles shortcuts parameter', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ shortcuts: '0' }) };

      const {
        state: { ui },
      } = initURL({ navigate, state: { location } });

      expect(ui).toEqual({ enableShortcuts: false });
    });

    it('handles panel parameter, bottom', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ panel: 'bottom' }) };

      const {
        state: { layout },
      } = initURL({ navigate, state: { location } });

      expect(layout).toEqual({ panelPosition: 'bottom' });
    });

    it('handles panel parameter, right', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ panel: 'right' }) };

      const {
        state: { layout },
      } = initURL({ navigate, state: { location } });

      expect(layout).toEqual({ panelPosition: 'right' });
    });

    it('handles panel parameter, 0', () => {
      const navigate = jest.fn();
      const location = { search: qs.stringify({ panel: '0' }) };

      const {
        state: { layout },
      } = initURL({ navigate, state: { location } });

      expect(layout).toEqual({ showPanel: false });
    });
  });

  describe('deprecated query parameters', () => {
    const defaultDeprecatedParameters = {
      selectedKind: 'kind',
      selectedStory: 'story',
      addons: '1',
      stories: '1',
      panelRight: '0',
    };

    it('sets sensible storyId for selectedKind/Story', () => {
      const location = { search: qs.stringify(defaultDeprecatedParameters) };
      const {
        state: { layout, storyId },
      } = initURL({ state: { location, viewMode } });

      // Nothing unexpected in layout
      expect(layout).toEqual({});
      expect(storyId).toEqual('kind--story');
    });

    it('sets sensible storyId for selectedKind only', () => {
      const location = { search: { selectedKind: 'kind' } };
      const {
        state: { storyId },
      } = initURL({ state: { location, viewMode } });

      expect(storyId).toEqual('kind');
    });

    it('handles addons and stories parameters', () => {
      const location = {
        search: qs.stringify({
          ...defaultDeprecatedParameters,
          addons: '0',
          stories: '0',
        }),
      };
      const {
        state: { layout },
      } = initURL({ state: { location } });

      expect(layout).toEqual({ showNav: false, showPanel: false });
    });

    it('handles panelRight parameter', () => {
      const location = {
        search: qs.stringify({
          ...defaultDeprecatedParameters,
          panelRight: '1',
        }),
      };
      const {
        state: { layout },
      } = initURL({ state: { location } });

      expect(layout).toEqual({ panelPosition: 'right' });
    });
  });
});

describe('queryParams', () => {
  it('lets your read out parameters you set previously', () => {
    let state = {};
    const store = {
      setState: (change) => {
        state = { ...state, ...change };
      },
      getState: () => state,
    };
    const { api } = initURL({ state: { location: { search: '' } }, navigate: jest.fn(), store });

    api.setQueryParams({ foo: 'bar' });

    expect(api.getQueryParam('foo')).toEqual('bar');
  });
});

describe('initModule', () => {
  const store = {
    state: {},
    getState() {
      return this.state;
    },
    setState(value) {
      this.state = { ...this.state, ...value };
    },
  };
  const storyState = (storyId) => ({
    path: `/story/${storyId}`,
    storyId,
    viewMode: 'story',
  });

  const fullAPI = {
    callbacks: {},
    on(event, fn) {
      this.callbacks[event] = this.callbacks[event] || [];
      this.callbacks[event].push(fn);
    },
    emit(event, ...args) {
      this.callbacks[event]?.forEach((cb) => cb(...args));
    },
    showReleaseNotesOnLaunch: jest.fn(),
  };

  beforeEach(() => {
    store.state = {};
    fullAPI.callbacks = {};
  });

  it('updates args param on SET_CURRENT_STORY', async () => {
    store.setState(storyState('test--story'));

    const { api, init } = initURL({ store, state: { location: {} }, fullAPI });
    Object.assign(fullAPI, api, {
      getCurrentStoryData: () => ({
        args: { a: 1, b: 2 },
        initialArgs: { a: 1, b: 1 },
        isLeaf: true,
      }),
    });
    init();

    fullAPI.emit(SET_CURRENT_STORY);
    expect(reachNavigate).toHaveBeenCalledWith(
      '/?path=/story/test--story&args=b:2',
      expect.objectContaining({ replace: true })
    );
    expect(store.getState().customQueryParams).toEqual({ args: 'b:2' });
  });

  it('updates globals param on GLOBALS_UPDATED', async () => {
    store.setState(storyState('test--story'));

    const { api, init } = initURL({ store, state: { location: {} }, fullAPI });
    Object.assign(fullAPI, api);
    init();

    fullAPI.emit(GLOBALS_UPDATED, { globals: { a: 2 }, initialGlobals: { a: 1, b: 1 } });
    expect(reachNavigate).toHaveBeenCalledWith(
      '/?path=/story/test--story&globals=a:2;b:!undefined',
      expect.objectContaining({ replace: true })
    );
    expect(store.getState().customQueryParams).toEqual({ globals: 'a:2;b:!undefined' });
  });

  it('adds url params alphabetically', async () => {
    store.setState({ ...storyState('test--story'), customQueryParams: { full: 1 } });

    const { api, init } = initURL({ store, state: { location: {} }, fullAPI });
    Object.assign(fullAPI, api, {
      getCurrentStoryData: () => ({ args: { a: 1 }, isLeaf: true }),
    });
    init();

    fullAPI.emit(GLOBALS_UPDATED, { globals: { g: 2 } });
    expect(reachNavigate).toHaveBeenCalledWith(
      '/?path=/story/test--story&full=1&globals=g:2',
      expect.objectContaining({ replace: true })
    );

    fullAPI.emit(SET_CURRENT_STORY);
    expect(reachNavigate).toHaveBeenCalledWith(
      '/?path=/story/test--story&args=a:1&full=1&globals=g:2',
      expect.objectContaining({ replace: true })
    );
  });

  it('navigates to release notes when needed', () => {
    fullAPI.showReleaseNotesOnLaunch.mockReturnValueOnce(true);

    const navigate = jest.fn();
    initURL({ store, state: { location: {} }, navigate, fullAPI }).init();

    expect(navigate).toHaveBeenCalledWith('/settings/release-notes');
  });
});
