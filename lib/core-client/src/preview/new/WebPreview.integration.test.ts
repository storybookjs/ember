import React from 'react';
import global from 'global';
import { RenderContext } from '@storybook/client-api/dist/ts3.9/new/types';
import { addons } from '@storybook/addons';

import { WebPreview } from './WebPreview';
import {
  componentOneExports,
  importFn,
  globalMeta,
  getGlobalMeta,
  storiesList,
  emitter,
  mockChannel,
  waitForEvents,
  waitForRender,
  waitForQuiescence,
} from './WebPreview.testdata';

// WebPreview.test mocks out all rendering
//   - ie. from`renderToDOM()` (stories) or`ReactDOM.render()` (docs) in.
// This file lets them rip.

addons.setChannel(mockChannel as any);

jest.mock('./WebView');
const mockStoriesList = storiesList;
jest.mock('unfetch', () =>
  jest.fn(() => ({
    json: () => mockStoriesList,
  }))
);

const { history, document } = global;
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
}));

beforeEach(() => {
  document.location.search = '';
  mockChannel.emit.mockClear();
  emitter.removeAllListeners();
  componentOneExports.default.loaders[0].mockReset().mockImplementation(async () => ({ l: 7 }));
  componentOneExports.default.parameters.docs.container.mockClear();
  componentOneExports.a.play.mockReset();
  globalMeta.renderToDOM.mockReset();
  globalMeta.render.mockClear();
  globalMeta.decorators[0].mockClear();
});

describe('WebPreview', () => {
  describe('initial render', () => {
    it('renders story mode through the stack', async () => {
      globalMeta.renderToDOM.mockImplementationOnce(
        ({ storyContext: { storyFn } }: RenderContext<any>) => storyFn()
      );
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalMeta, importFn }).initialize();

      await waitForRender();

      expect(globalMeta.decorators[0]).toHaveBeenCalled();
      expect(globalMeta.render).toHaveBeenCalled();
    });

    it('renders docs mode through docs page', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new WebPreview({ getGlobalMeta, importFn });

      const docsRoot = window.document.createElement('div');
      preview.view.prepareForDocs.mockReturnValue(docsRoot);
      componentOneExports.default.parameters.docs.container.mockImplementationOnce(() =>
        React.createElement('div', {}, 'INSIDE')
      );

      await preview.initialize();
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
    const newGetGlobalMeta = () => {
      return {
        ...globalMeta,
        args: { a: 'second' },
        globals: { a: 'second' },
        decorators: [newGlobalDecorator],
      };
    };

    it('renders story mode through the updated stack', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalMeta, importFn });
      await preview.initialize();
      await waitForRender();

      globalMeta.renderToDOM.mockImplementationOnce(
        ({ storyContext: { storyFn } }: RenderContext<any>) => storyFn()
      );
      globalMeta.decorators[0].mockClear();
      mockChannel.emit.mockClear();
      preview.onGetGlobalMetaChanged({ getGlobalMeta: newGetGlobalMeta });
      await waitForRender();

      expect(globalMeta.decorators[0]).not.toHaveBeenCalled();
      expect(newGlobalDecorator).toHaveBeenCalled();
      expect(globalMeta.render).toHaveBeenCalled();
    });
  });
});
