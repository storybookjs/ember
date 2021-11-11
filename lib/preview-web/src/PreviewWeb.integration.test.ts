import React from 'react';
import global from 'global';
import { RenderContext } from '@storybook/store';
import addons, { mockChannel as createMockChannel } from '@storybook/addons';

import { PreviewWeb } from './PreviewWeb';
import {
  componentOneExports,
  importFn,
  projectAnnotations,
  getProjectAnnotations,
  emitter,
  mockChannel,
  waitForRender,
  storyIndex as mockStoryIndex,
} from './PreviewWeb.mockdata';

// PreviewWeb.test mocks out all rendering
//   - ie. from`renderToDOM()` (stories) or`ReactDOM.render()` (docs) in.
// This file lets them rip.

jest.mock('@storybook/channel-postmessage', () => () => mockChannel);

jest.mock('./WebView');

const { window, document } = global;
jest.mock('global', () => ({
  // @ts-ignore
  ...jest.requireActual('global'),
  history: { replaceState: jest.fn() },
  document: {
    ...jest.requireActual('global').document,
    location: {
      pathname: 'pathname',
      search: '?id=*',
    },
  },
  FEATURES: {
    storyStoreV7: true,
  },
  fetch: async () => ({ status: 200, json: async () => mockStoryIndex }),
}));

beforeEach(() => {
  document.location.search = '';
  mockChannel.emit.mockClear();
  emitter.removeAllListeners();
  componentOneExports.default.loaders[0].mockReset().mockImplementation(async () => ({ l: 7 }));
  componentOneExports.default.parameters.docs.container.mockClear();
  componentOneExports.a.play.mockReset();
  projectAnnotations.renderToDOM.mockReset();
  projectAnnotations.render.mockClear();
  projectAnnotations.decorators[0].mockClear();

  addons.setChannel(mockChannel as any);
  addons.setServerChannel(createMockChannel());
});

describe('PreviewWeb', () => {
  describe('initial render', () => {
    it('renders story mode through the stack', async () => {
      projectAnnotations.renderToDOM.mockImplementationOnce(({ storyFn }: RenderContext<any>) =>
        storyFn()
      );
      document.location.search = '?id=component-one--a';
      await new PreviewWeb().initialize({ importFn, getProjectAnnotations });

      await waitForRender();

      expect(projectAnnotations.decorators[0]).toHaveBeenCalled();
      expect(projectAnnotations.render).toHaveBeenCalled();
    });

    it('renders docs mode through docs page', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new PreviewWeb();

      const docsRoot = window.document.createElement('div');
      // @ts-ignore
      preview.view.prepareForDocs.mockReturnValue(docsRoot);
      componentOneExports.default.parameters.docs.container.mockImplementationOnce(() =>
        React.createElement('div', {}, 'INSIDE')
      );

      await preview.initialize({ importFn, getProjectAnnotations });
      await waitForRender();

      expect(docsRoot.outerHTML).toMatchInlineSnapshot(`
        <div>
          <div>
            INSIDE
          </div>
        </div>
      `);
    });
  });

  describe('onGetGlobalMeta changed (HMR)', () => {
    const newGlobalDecorator = jest.fn((s) => s());
    const newGetProjectAnnotations = () => {
      return {
        ...projectAnnotations,
        args: { a: 'second' },
        globals: { a: 'second' },
        decorators: [newGlobalDecorator],
      };
    };

    it('renders story mode through the updated stack', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new PreviewWeb();
      await preview.initialize({ importFn, getProjectAnnotations });
      await waitForRender();

      projectAnnotations.renderToDOM.mockImplementationOnce(({ storyFn }: RenderContext<any>) =>
        storyFn()
      );
      projectAnnotations.decorators[0].mockClear();
      mockChannel.emit.mockClear();
      preview.onGetProjectAnnotationsChanged({ getProjectAnnotations: newGetProjectAnnotations });
      await waitForRender();

      expect(projectAnnotations.decorators[0]).not.toHaveBeenCalled();
      expect(newGlobalDecorator).toHaveBeenCalled();
      expect(projectAnnotations.render).toHaveBeenCalled();
    });
  });
});
