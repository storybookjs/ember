import { logger } from '@storybook/client-logger';
import { addons, mockChannel } from '@storybook/addons';
import Events from '@storybook/core-events';
import ClientApi from './client_api';

// import ConfigApi from './config_api';

describe('ClientApi', () => {
  describe('setAddon', () => {
    it('should register addons', () => {
      const clientApi = new ClientApi();
      let data;

      clientApi.setAddon({
        aa() {
          data = 'foo';
        },
      });

      // @ts-ignore
      clientApi.storiesOf('none', module).aa();
      expect(data).toBe('foo');
    });

    it('should not remove previous addons', () => {
      const clientApi = new ClientApi();
      const data = [];

      clientApi.setAddon({
        aa() {
          data.push('foo');
        },
      });

      clientApi.setAddon({
        bb() {
          data.push('bar');
        },
      });

      // @ts-ignore
      clientApi.storiesOf('none', module).aa().bb();
      expect(data).toEqual(['foo', 'bar']);
    });

    it('should call with the clientApi context', () => {
      const clientApi = new ClientApi();
      let data;

      clientApi.setAddon({
        aa() {
          data = typeof this.add;
        },
      });

      // @ts-ignore
      clientApi.storiesOf('none', module).aa();
      expect(data).toBe('function');
    });

    it('should be able to access addons added previously', () => {
      const clientApi = new ClientApi();
      let data;

      clientApi.setAddon({
        aa() {
          data = 'foo';
        },
      });

      clientApi.setAddon({
        bb() {
          this.aa();
        },
      });

      // @ts-ignore
      clientApi.storiesOf('none', module).bb();
      expect(data).toBe('foo');
    });

    it('should be able to access the current kind', () => {
      const clientApi = new ClientApi();
      const kind = 'dfdwf3e3';
      let data;

      clientApi.setAddon({
        aa() {
          data = this.kind;
        },
      });

      // @ts-ignore
      clientApi.storiesOf(kind, module).aa();
      expect(data).toBe(kind);
    });
  });

  // TODO
  describe.skip('getStorybook', () => {
    it('should transform the storybook to an array with filenames', () => {
      const {
        clientApi: { getStorybook, storiesOf },
      } = getContext();

      let book;

      book = getStorybook();
      expect(book).toEqual([]);

      storiesOf('kind 1', module)
        .add('name 1', () => '1')
        .add('name 2', () => '2');

      storiesOf('kind 2', module)
        .add('name 1', () => '1')
        .add('name 2', () => '2');

      book = getStorybook();

      expect(book).toEqual([
        expect.objectContaining({
          fileName: expect.any(String),
          kind: 'kind 1',
          stories: [
            {
              name: 'name 1',
              render: expect.any(Function),
            },
            {
              name: 'name 2',
              render: expect.any(Function),
            },
          ],
        }),
        expect.objectContaining({
          fileName: expect.any(String),
          kind: 'kind 2',
          stories: [
            {
              name: 'name 1',
              render: expect.any(Function),
            },
            {
              name: 'name 2',
              render: expect.any(Function),
            },
          ],
        }),
      ]);
    });

    it('reads filename from module', () => {
      const {
        clientApi: { getStorybook, storiesOf },
      } = getContext();

      const fn = jest.fn();
      storiesOf('kind', { id: 'foo.js' } as NodeModule).add('name', fn);

      const storybook = getStorybook();

      expect(storybook).toEqual([
        {
          kind: 'kind',
          fileName: 'foo.js',
          stories: [
            {
              name: 'name',
              render: expect.any(Function),
            },
          ],
        },
      ]);
    });

    it('should stringify ids from module', () => {
      const {
        clientApi: { getStorybook, storiesOf },
      } = getContext();

      const fn = jest.fn();
      storiesOf('kind', { id: 1211 } as NodeModule).add('name', fn);

      const storybook = getStorybook();

      expect(storybook).toEqual([
        {
          kind: 'kind',
          fileName: '1211',
          stories: [
            {
              name: 'name',
              render: expect.any(Function),
            },
          ],
        },
      ]);
    });
  });

  describe('getStoriesList', () => {
    it('should remember the order that files were added in', async () => {
      const clientApi = new ClientApi();

      let disposeCallback: () => void;
      const module1 = {
        id: 'file1',
        hot: {
          data: {},
          accept: jest.fn(),
          dispose(cb: () => void) {
            disposeCallback = cb;
          },
        },
      };
      const module2 = {
        id: 'file2',
      };
      clientApi.storiesOf('kind1', (module1 as unknown) as NodeModule).add('story1', jest.fn());
      clientApi.storiesOf('kind2', (module2 as unknown) as NodeModule).add('story2', jest.fn());

      expect(Object.keys(clientApi.getStoriesList().stories)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);

      disposeCallback();
      clientApi.storiesOf('kind1', (module1 as unknown) as NodeModule).add('story1', jest.fn());
      expect(Object.keys(clientApi.getStoriesList().stories)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);
    });
  });
});
