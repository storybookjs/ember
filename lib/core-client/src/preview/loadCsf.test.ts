// TODO

export {};

// import { ConfigApi, ClientApi, StoryStore } from '@storybook/client-api';
// import { logger } from '@storybook/client-logger';
// import { RequireContext } from './types';

// import { loadCsf } from './loadCsf';

// jest.mock('@storybook/client-logger', () => ({
//   logger: { warn: jest.fn(), debug: jest.fn() },
// }));

// let cbs: ((data: any) => void)[];
// let mod: NodeModule;
// beforeEach(() => {
//   cbs = [];
//   mod = ({
//     hot: {
//       data: {},
//       dispose: (cb: (data: any) => void) => cbs.push(cb),
//       accept: jest.fn(),
//     },
//   } as unknown) as NodeModule;
// });

// function doHMRDispose() {
//   cbs.forEach((cb) => cb(mod.hot.data));
//   cbs = [];
// }

// afterEach(() => {
//   doHMRDispose();
// });

// function makeMocks() {
//   const configApi = ({ configure: (x: Function) => x() } as unknown) as ConfigApi;
//   const storyStore = ({
//     removeStoryKind: jest.fn(),
//   } as unknown) as StoryStore;
//   const clientApi = ({
//     storiesOf: jest.fn().mockImplementation(() => ({
//       addParameters: jest.fn(),
//       addDecorator: jest.fn(),
//       add: jest.fn(),
//     })),
//   } as unknown) as ClientApi;

//   const context = { configApi, storyStore, clientApi };
//   const configure = loadCsf(context);
//   return { ...context, configure };
// }

// function makeRequireContext(map: Record<string, any>): RequireContext {
//   const context = (key: string) => map[key];

//   return Object.assign(context, {
//     keys: () => Object.keys(map),
//     resolve: (key: string) => key,
//   });
// }

// describe('core.preview.loadCsf', () => {

//   it('handles HMR correctly when adding stories', () => {
//     const { configure, clientApi, storyStore } = makeMocks();

//     const firstInput = {
//       a: {
//         default: {
//           title: 'a',
//         },
//         x: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(firstInput), mod);

//     // HMR dispose callbacks
//     doHMRDispose();

//     const mockedStoriesOf = clientApi.storiesOf as jest.Mock;
//     mockedStoriesOf.mockClear();
//     const secondInput = {
//       ...firstInput,
//       b: {
//         default: {
//           title: 'b',
//         },
//         x: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(secondInput), mod);

//     expect(storyStore.removeStoryKind).not.toHaveBeenCalled();
//     expect(mockedStoriesOf).toHaveBeenCalledWith('b', true);
//   });

//   it('handles HMR correctly when removing stories', () => {
//     const { configure, clientApi, storyStore } = makeMocks();

//     const firstInput = {
//       a: {
//         default: {
//           title: 'a',
//         },
//         x: () => 0,
//       },
//       b: {
//         default: {
//           title: 'b',
//         },
//         x: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(firstInput), mod);

//     // HMR dispose callbacks
//     doHMRDispose();

//     const mockedStoriesOf = clientApi.storiesOf as jest.Mock;
//     mockedStoriesOf.mockClear();
//     const secondInput = {
//       a: firstInput.a,
//     };
//     configure('react', makeRequireContext(secondInput), mod);

//     expect(storyStore.removeStoryKind).toHaveBeenCalledWith('b');
//     expect(mockedStoriesOf).not.toHaveBeenCalled();
//   });

//   it('handles HMR correctly when changing stories', () => {
//     const { configure, clientApi, storyStore } = makeMocks();

//     const firstInput = {
//       a: {
//         default: {
//           title: 'a',
//         },
//         x: () => 0,
//       },

//       b: {
//         default: {
//           title: 'b',
//         },
//         x: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(firstInput), mod);

//     // HMR dispose callbacks
//     doHMRDispose();

//     const mockedStoriesOf = clientApi.storiesOf as jest.Mock;
//     mockedStoriesOf.mockClear();
//     const secondInput = {
//       ...firstInput,
//       a: {
//         default: {
//           title: 'a',
//         },
//         x: () => 0,
//         y: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(secondInput), mod);

//     expect(storyStore.removeStoryKind).toHaveBeenCalledTimes(1);
//     expect(storyStore.removeStoryKind).toHaveBeenCalledWith('a');
//     expect(mockedStoriesOf).toHaveBeenCalledWith('a', true);
//   });

//   it('gives a warning if there are no exported stories', () => {
//     const { configure } = makeMocks();

//     const input = {
//       a: {
//         default: {
//           title: 'MissingExportsComponent',
//         },
//         // no named exports, will not present a story
//       },
//     };
//     configure('react', makeRequireContext(input), mod);
//     expect(logger.warn).toHaveBeenCalled();
//   });

//   it('does not give a warning if there are exported stories', () => {
//     const { configure } = makeMocks();

//     const input = {
//       a: {
//         default: {
//           title: 'MissingExportsComponent',
//         },
//         x: () => 0,
//       },
//     };
//     configure('react', makeRequireContext(input), mod);
//     expect(logger.warn).not.toHaveBeenCalled();
//   });
// });
