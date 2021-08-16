import { EventEmitter } from 'events';
import Events from '@storybook/core-events';
import { StoriesList } from '@storybook/client-api/dist/ts3.9/new/types';

export const componentOneExports = {
  default: {
    title: 'Component One',
    argTypes: {
      foo: { type: { name: 'string' } },
    },
    loaders: [jest.fn()],
    parameters: {
      docs: { container: jest.fn() },
    },
  },
  a: { args: { foo: 'a' }, play: jest.fn() },
  b: { args: { foo: 'b' }, play: jest.fn() },
};
export const componentTwoExports = {
  default: { title: 'Component Two' },
  c: { args: { foo: 'c' } },
};
export const importFn = jest.fn(async (path) => {
  return path === './src/ComponentOne.stories.js' ? componentOneExports : componentTwoExports;
});

export const globalMeta = {
  globals: { a: 'b' },
  globalTypes: {},
  decorators: [jest.fn((s) => s())],
  render: jest.fn(),
  renderToDOM: jest.fn(),
};
export const getGlobalMeta = () => globalMeta;

export const storiesList: StoriesList = {
  v: 3,
  stories: {
    'component-one--a': {
      title: 'Component One',
      name: 'A',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-one--b': {
      title: 'Component One',
      name: 'B',
      importPath: './src/ComponentOne.stories.js',
    },
    'component-two--c': {
      title: 'Component Two',
      name: 'C',
      importPath: './src/ComponentTwo.stories.js',
    },
  },
};

export const emitter = new EventEmitter();
export const mockChannel = {
  on: emitter.on.bind(emitter),
  removeListener: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

export const waitForEvents = (events: string[]) => {
  // We've already emitted a render event. NOTE if you want to test a second call,
  // ensure you call `mockChannel.emit.mockClear()` before `waitForRender`
  if (mockChannel.emit.mock.calls.find((call) => events.includes(call[0]))) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    mockChannel.emit.mockImplementation((event) => {
      if (events.includes(event)) {
        resolve(null);
      }
    });

    // Don't wait too long
    waitForQuiescence().then(() => reject(new Error('Event was not emitted in time')));
  });
};

// The functions on the preview that trigger rendering don't wait for
// the async parts, so we need to listen for the "done" events
export const waitForRender = () =>
  waitForEvents([
    Events.STORY_RENDERED,
    Events.DOCS_RENDERED,
    Events.STORY_THREW_EXCEPTION,
    Events.STORY_ERRORED,
  ]);

export const waitForQuiescence = async () => new Promise((r) => setTimeout(r, 100));
