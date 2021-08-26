import React from 'react';
import global from 'global';
import { RenderContext } from '@storybook/store';

import { WebPreview } from './WebPreview';
import {
  componentOneExports,
  importFn,
  globalAnnotations,
  getGlobalAnnotations,
  storiesList,
  emitter,
  mockChannel,
  waitForRender,
} from './WebPreview.mockdata';

// WebPreview.test mocks out all rendering
//   - ie. from`renderToDOM()` (stories) or`ReactDOM.render()` (docs) in.
// This file lets them rip.

jest.mock('@storybook/channel-postmessage', () => () => mockChannel);

jest.mock('./WebView');
const mockStoriesList = storiesList;
jest.mock('unfetch', () =>
  jest.fn(() => ({
    json: () => mockStoriesList,
  }))
);

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
}));

beforeEach(() => {
  document.location.search = '';
  mockChannel.emit.mockClear();
  emitter.removeAllListeners();
  componentOneExports.default.loaders[0].mockReset().mockImplementation(async () => ({ l: 7 }));
  componentOneExports.default.parameters.docs.container.mockClear();
  componentOneExports.a.play.mockReset();
  globalAnnotations.renderToDOM.mockReset();
  globalAnnotations.render.mockClear();
  globalAnnotations.decorators[0].mockClear();
});

describe('WebPreview', () => {
  describe('initial render', () => {
    it('renders story mode through the stack', async () => {
      globalAnnotations.renderToDOM.mockImplementationOnce(({ storyFn }: RenderContext<any>) =>
        storyFn()
      );
      document.location.search = '?id=component-one--a';
      await new WebPreview({ getGlobalAnnotations, importFn }).initialize();

      await waitForRender();

      expect(globalAnnotations.decorators[0]).toHaveBeenCalled();
      expect(globalAnnotations.render).toHaveBeenCalled();
    });

    it('renders docs mode through docs page', async () => {
      document.location.search = '?id=component-one--a&viewMode=docs';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });

      const docsRoot = window.document.createElement('div');
      // @ts-ignore
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
    const newGetGlobalAnnotations = () => {
      return {
        ...globalAnnotations,
        args: { a: 'second' },
        globals: { a: 'second' },
        decorators: [newGlobalDecorator],
      };
    };

    it('renders story mode through the updated stack', async () => {
      document.location.search = '?id=component-one--a';
      const preview = new WebPreview({ getGlobalAnnotations, importFn });
      await preview.initialize();
      await waitForRender();

      globalAnnotations.renderToDOM.mockImplementationOnce(({ storyFn }: RenderContext<any>) =>
        storyFn()
      );
      globalAnnotations.decorators[0].mockClear();
      mockChannel.emit.mockClear();
      preview.onGetGlobalAnnotationsChanged({ getGlobalAnnotations: newGetGlobalAnnotations });
      await waitForRender();

      expect(globalAnnotations.decorators[0]).not.toHaveBeenCalled();
      expect(newGlobalDecorator).toHaveBeenCalled();
      expect(globalAnnotations.render).toHaveBeenCalled();
    });
  });
});
