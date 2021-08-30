// /* eslint-disable no-underscore-dangle */
// import createChannel from '@storybook/channel-postmessage';
// import { toId } from '@storybook/csf';
// import { addons, mockChannel } from '@storybook/addons';
// import Events from '@storybook/core-events';

// import StoryStore from './story_store';
// import { defaultDecorateStory } from './decorators';

// jest.mock('@storybook/node-logger', () => ({
//   logger: {
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
//   },
// }));

// let channel;
// beforeEach(() => {
//   channel = createChannel({ page: 'preview' });
// });

// function addReverseSorting(store) {
//   store.addGlobalMetadata({
//     decorators: [],
//     parameters: {
//       options: {
//         // Test function does reverse alphabetical ordering.
//         storySort: (a: any, b: any): number =>
//           a[1].kind === b[1].kind
//             ? 0
//             : -1 * a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
//       },
//     },
//   });
// }

// // make a story and add it to the store
// const addStoryToStore = (store, kind, name, storyFn, parameters = {}) =>
//   store.addStory(
//     {
//       kind,
//       name,
//       storyFn,
//       parameters,
//       id: toId(kind, name),
//     },
//     {
//       // FIXME: need applyHooks, but this breaks the current tests
//       applyDecorators: defaultDecorateStory,
//     }
//   );

// describe('configuration', () => {
//   it('does not allow addStory if not configuring, unless allowUsafe=true', () => {
//     const store = new StoryStore({ channel });
//     store.finishConfiguring();

//     expect(() => addStoryToStore(store, 'a', '1', () => 0)).toThrow(
//       'Cannot add a story when not configuring'
//     );

//     expect(() =>
//       store.addStory(
//         {
//           kind: 'a',
//           name: '1',
//           storyFn: () => 0,
//           parameters: {},
//           id: 'a--1',
//         },
//         {
//           applyDecorators: defaultDecorateStory,
//           allowUnsafe: true,
//         }
//       )
//     ).not.toThrow();
//   });

//   it('does not allow remove if not configuring, unless allowUsafe=true', () => {
//     const store = new StoryStore({ channel });
//     addons.setChannel(channel);
//     addStoryToStore(store, 'a', '1', () => 0);
//     store.finishConfiguring();

//     expect(() => store.remove('a--1')).toThrow('Cannot remove a story when not configuring');
//     expect(() => store.remove('a--1', { allowUnsafe: true })).not.toThrow();
//   });

//   it('does not allow removeStoryKind if not configuring, unless allowUsafe=true', () => {
//     const store = new StoryStore({ channel });
//     addons.setChannel(channel);
//     addStoryToStore(store, 'a', '1', () => 0);
//     store.finishConfiguring();

//     expect(() => store.removeStoryKind('a')).toThrow('Cannot remove a kind when not configuring');
//     expect(() => store.removeStoryKind('a', { allowUnsafe: true })).not.toThrow();
//   });

//   it('waits for configuration to be over before emitting SET_STORIES', () => {
//     const onSetStories = jest.fn();
//     channel.on(Events.SET_STORIES, onSetStories);
//     const store = new StoryStore({ channel });

//     addStoryToStore(store, 'a', '1', () => 0);
//     expect(onSetStories).not.toHaveBeenCalled();

//     store.finishConfiguring();
//     expect(onSetStories).toHaveBeenCalledWith({
//       v: 2,
//       globals: {},
//       globalParameters: {},
//       kindParameters: { a: {} },
//       stories: {
//         'a--1': expect.objectContaining({
//           id: 'a--1',
//         }),
//       },
//     });
//   });

//   it('correctly emits globals with SET_STORIES', () => {
//     const onSetStories = jest.fn();
//     channel.on(Events.SET_STORIES, onSetStories);
//     const store = new StoryStore({ channel });

//     store.addGlobalMetadata({
//       decorators: [],
//       parameters: {
//         globalTypes: {
//           arg1: { defaultValue: 'arg1' },
//         },
//       },
//     });

//     addStoryToStore(store, 'a', '1', () => 0);
//     expect(onSetStories).not.toHaveBeenCalled();

//     store.finishConfiguring();
//     expect(onSetStories).toHaveBeenCalledWith({
//       v: 2,
//       globals: { arg1: 'arg1' },
//       globalParameters: {
//         // NOTE: Currently globalArg[Types] are emitted as parameters but this may not remain
//         globalTypes: {
//           arg1: { defaultValue: 'arg1' },
//         },
//       },
//       kindParameters: { a: {} },
//       stories: {
//         'a--1': expect.objectContaining({
//           id: 'a--1',
//         }),
//       },
//     });
//   });

//   it('emits an empty SET_STORIES if no stories were added during configuration', () => {
//     const onSetStories = jest.fn();
//     channel.on(Events.SET_STORIES, onSetStories);
//     const store = new StoryStore({ channel });

//     store.finishConfiguring();
//     expect(onSetStories).toHaveBeenCalledWith({
//       v: 2,
//       globals: {},
//       globalParameters: {},
//       kindParameters: {},
//       stories: {},
//     });
//   });

//   it('allows configuration as second time (HMR)', () => {
//     const onSetStories = jest.fn();
//     channel.on(Events.SET_STORIES, onSetStories);
//     const store = new StoryStore({ channel });
//     store.finishConfiguring();

//     onSetStories.mockClear();
//     store.startConfiguring();
//     addStoryToStore(store, 'a', '1', () => 0);
//     store.finishConfiguring();

//     expect(onSetStories).toHaveBeenCalledWith({
//       v: 2,
//       globals: {},
//       globalParameters: {},
//       kindParameters: { a: {} },
//       stories: {
//         'a--1': expect.objectContaining({
//           id: 'a--1',
//         }),
//       },
//     });
//   });
// });
