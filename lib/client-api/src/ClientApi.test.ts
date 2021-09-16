import addons, { mockChannel } from '@storybook/addons';
import { ClientApi } from './ClientApi';

beforeEach(() => {
  addons.setChannel(mockChannel());
});

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

  describe('fetchStoryIndex', () => {
    it('should remember the order that files were added in', async () => {
      const clientApi = new ClientApi();
      const store = {
        processCSFFileWithCache: jest.fn(() => ({ meta: { title: 'title' } })),
        storyFromCSFFile: jest.fn(({ storyId }) => ({
          parameters: { fileName: storyId.split('-')[0].replace('kind', 'file') },
        })),
      };
      clientApi.storyStore = store as any;

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

      expect(Object.keys(clientApi.fetchStoryIndex().stories)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);

      disposeCallback();
      clientApi.storiesOf('kind1', (module1 as unknown) as NodeModule).add('story1', jest.fn());
      expect(Object.keys(clientApi.fetchStoryIndex().stories)).toEqual([
        'kind1--story1',
        'kind2--story2',
      ]);
    });
  });
});
