/* eslint-disable no-underscore-dangle */

import { addons, mockChannel } from '@storybook/addons';
import { SET_CURRENT_STORY } from '@storybook/core-events';
import global from 'global';

import { EVENTS } from './constants';
import { instrument } from './instrument';

const callSpy = jest.fn();
addons.setChannel(mockChannel());
addons.getChannel().on(EVENTS.CALL, callSpy);

class HTMLElement {
  constructor(props: any) {
    Object.assign(this, props);
  }
}

delete global.window.location;
global.window.location = { reload: jest.fn() };
global.window.HTMLElement = HTMLElement;
global.window.__STORYBOOK_ADDON_TEST_PREVIEW__ = {};
global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__ = {};

beforeEach(() => {
  addons.getChannel().emit(SET_CURRENT_STORY);
  callSpy.mockReset();

  // Reset iframeState
  global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.n = 0;
  global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.next = {};
  global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.callRefsByResult = new Map();
  global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.parentCallId = undefined;
  global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.forwardedException = undefined;

  // Reset sharedState
  global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.isDebugging = false;
  global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.chainedCallIds = new Set();
  global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.playUntil = undefined;
});

describe('instrument', () => {
  it('patches object methods', () => {
    const fn = () => {};
    const result = instrument({ fn });
    expect(result).toStrictEqual({ fn: expect.any(Function) });
    expect(result.fn.name).toBe('fn');
    expect(result.fn._original).toBe(fn);
  });

  it('patches nested methods', () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const result = instrument({ foo: { fn1, bar: { fn2 } } });
    expect(result).toStrictEqual({
      foo: {
        fn1: expect.any(Function),
        bar: { fn2: expect.any(Function) },
      },
    });
    expect(result.foo.fn1._original).toBe(fn1);
    expect(result.foo.bar.fn2._original).toBe(fn2);
  });

  it('does not patch already patched functions', () => {
    const fn = () => {};
    const result = instrument(instrument({ fn }));
    expect(result.fn._original).toBe(fn);
    expect(result.fn._original._original).not.toBeDefined();
  });

  it('does not traverse into arrays', () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const result = instrument({ arr: [fn1, { fn2 }] });
    expect(result).toStrictEqual({ arr: [fn1, { fn2 }] });
    expect(result.arr[0]._original).not.toBeDefined();
    expect(result.arr[1].fn2._original).not.toBeDefined();
  });

  it('patches function properties on functions', () => {
    const fn1 = () => {};
    fn1.fn2 = () => {};
    const result = instrument({ fn1 });
    expect(result.fn1).toEqual(expect.any(Function));
    expect(result.fn1.fn2).toEqual(expect.any(Function));
    expect(result.fn1._original).toBe(fn1);
    expect(result.fn1.fn2._original).toBe(fn1.fn2);
  });

  it('patched functions call the original function when invoked', () => {
    const { fn } = instrument({ fn: jest.fn() });
    const obj = {};
    fn('foo', obj);
    expect(fn._original).toHaveBeenCalledWith('foo', obj);
  });

  it('emits a "call" event every time a patched function is invoked', () => {
    const { fn } = instrument({ fn: () => {} });
    fn('foo', 'bar');
    fn('baz');
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1-fn',
        args: ['foo', 'bar'],
      })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2-fn',
        args: ['baz'],
      })
    );
  });

  it('provides metadata about the call in the event', () => {
    const { obj } = instrument({ obj: { fn: () => {} } });
    obj.fn();
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ['obj'],
        method: 'fn',
        interceptable: false,
        state: 'done',
        parentCallId: undefined,
      })
    );
  });

  it('maps event args which originate from an earlier call to a call ref', () => {
    const { fn1, fn2 } = instrument({
      fn1: (arg: any) => arg,
      fn2: () => {},
    });
    fn2(fn1({}));
    expect(callSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'fn2',
        args: [{ __callId__: callSpy.mock.calls[0][0].id, retain: false }],
      })
    );
  });

  it('does not map primitive event args which originate from an earlier call', () => {
    const { fn1, fn2 } = instrument({
      fn1: (arg: any) => arg,
      fn2: () => {},
    });
    fn2(
      fn1(undefined),
      fn1(null),
      fn1(true),
      fn1('foo'),
      fn1(1),
      fn1(BigInt(1)), // eslint-disable-line no-undef
      fn1({}),
      fn1([]),
      fn1(() => {}),
      fn1(Symbol('hi')),
      fn1(new Error('Oops'))
    );
    expect(callSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'fn2',
        args: [
          /* call 0 */ undefined,
          /* call 1 */ null,
          /* call 2 */ true,
          /* call 3 */ 'foo',
          /* call 4 */ 1,
          /* call 5 */ BigInt(1), // eslint-disable-line no-undef
          { __callId__: callSpy.mock.calls[6][0].id, retain: false },
          { __callId__: callSpy.mock.calls[7][0].id, retain: false },
          { __callId__: callSpy.mock.calls[8][0].id, retain: false },
          { __callId__: callSpy.mock.calls[9][0].id, retain: false },
          { __callId__: callSpy.mock.calls[10][0].id, retain: false },
        ],
      })
    );
  });

  it('maps HTML Elements in event args to an element ref', () => {
    const { fn } = instrument({ fn: () => {} });
    fn(new HTMLElement({ prefix: '', localName: 'div', id: 'root', classList: [] }));
    expect(callSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [{ __element__: { prefix: '', localName: 'div', id: 'root', classNames: [] } }],
      })
    );
  });

  it('tracks the parent call id for calls inside callbacks', () => {
    const fn = (callback: Function) => callback && callback();
    const { fn1, fn2, fn3, fn4, fn5 } = instrument({ fn1: fn, fn2: fn, fn3: fn, fn4: fn, fn5: fn });
    fn1(() => {
      fn2(() => fn3());
      fn4();
    });
    fn5();
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1-fn1', parentCallId: undefined })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2-fn2', parentCallId: '1-fn1' })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '3-fn3', parentCallId: '2-fn2' })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '4-fn4', parentCallId: '1-fn1' })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '5-fn5', parentCallId: undefined })
    );
  });

  it('tracks the parent call id for async callbacks', async () => {
    const fn = (callback: Function) => Promise.resolve(callback && callback());
    const { fn1, fn2, fn3 } = instrument({ fn1: fn, fn2: fn, fn3: fn });
    await fn1(() => fn2());
    await fn3();
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1-fn1', parentCallId: undefined })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2-fn2', parentCallId: '1-fn1' })
    );
    expect(callSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: '3-fn3', parentCallId: undefined })
    );
  });

  it('instruments the call result to support chaining', () => {
    const { fn1 } = instrument({
      fn1: () => ({
        fn2: () => {},
      }),
    });
    fn1().fn2();
    expect(callSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'fn2',
        path: [{ __callId__: callSpy.mock.calls[0][0].id }],
      })
    );
  });

  it('catches thrown errors and returns the error', () => {
    const { fn } = instrument({
      fn: () => {
        throw new Error('Boom!');
      },
    });
    expect(fn).not.toThrow();
    expect(fn()).toEqual(new Error('Boom!'));
  });

  it('forwards nested exceptions', () => {
    const { fn1, fn2 } = instrument({
      fn1: () => {}, // doesn't forward args
      fn2: () => {
        throw new Error('Boom!');
      },
    });
    expect(fn1(fn2())).toEqual(new Error('Boom!'));
  });

  it("re-throws anything that isn't an error", () => {
    const { fn } = instrument({
      fn: () => {
        throw 'Boom!'; // eslint-disable-line no-throw-literal
      },
    });
    expect(fn).toThrow('Boom!');
    expect(callSpy).not.toHaveBeenCalled();
  });

  it('does not affect intercepted methods', () => {
    const { fn } = instrument({ fn: jest.fn() }, { intercept: true });
    fn('foo');
    expect(fn._original).toHaveBeenCalledWith('foo');
  });

  it('reloads the page on the "reload" event', () => {
    addons.getChannel().emit(EVENTS.RELOAD);
    expect(global.window.location.reload).toHaveBeenCalled();
  });

  it('resets preview state when switching stories', () => {
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.n = 123;
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.next = { ref: () => {} };
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.callRefsByResult = new Map([[{}, 'ref']]);
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.parentCallId = '1-foo';
    global.window.__STORYBOOK_ADDON_TEST_PREVIEW__.forwardedException = new Error('Oops');
    addons.getChannel().emit(SET_CURRENT_STORY);
    expect(global.window.__STORYBOOK_ADDON_TEST_PREVIEW__).toStrictEqual({
      n: 0,
      next: {},
      callRefsByResult: new Map(),
      parentCallId: undefined,
      forwardedException: undefined,
    });
  });

  describe('with intercept: true', () => {
    const options = { intercept: true };

    it('emits a call event with exception metadata when the function throws', () => {
      const { fn } = instrument(
        {
          fn: () => {
            throw new Error('Boom!');
          },
        },
        options
      );
      expect(fn).toThrow();
      expect(callSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1-fn',
          exception: {
            name: 'Error',
            message: 'Boom!',
            stack: expect.stringContaining('Error: Boom!'),
          },
        })
      );
    });

    it('catches thrown errors and throws an ignoredException instead', () => {
      const { fn } = instrument(
        {
          fn: () => {
            throw new Error('Boom!');
          },
        },
        options
      );
      expect(fn).toThrow('ignoredException');
    });

    it('catches forwarded exceptions and throws an ignoredException instead', () => {
      const { fn1, fn2 } = instrument(
        {
          fn1: () => {},
          fn2: () => {
            throw new Error('Boom!');
          },
        },
        options
      );
      expect(() => fn1(fn2())).toThrow('ignoredException');
    });
  });

  describe('while debugging', () => {
    beforeEach(() => {
      global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.isDebugging = true;
    });

    it('defers calls to intercepted functions', () => {
      const { fn } = instrument({ fn: jest.fn() }, { intercept: true });
      expect(fn()).toEqual(expect.any(Promise));
      expect(fn._original).not.toHaveBeenCalled();
    });

    it('does not defer calls to non-intercepted functions', () => {
      const { fn } = instrument({ fn: jest.fn(() => 'ok') });
      expect(fn()).toBe('ok');
      expect(fn._original).toHaveBeenCalled();
    });

    it('does not defer calls to intercepted functions that are chained upon', () => {
      const { fn1 } = instrument({ fn1: jest.fn(() => ({ fn2: jest.fn() })) }, { intercept: true });
      global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.chainedCallIds.add('1-fn1');
      const res1 = fn1();
      expect(res1.fn2()).toEqual(expect.any(Promise));
      expect(fn1._original).toHaveBeenCalled();
      expect(res1.fn2._original).not.toHaveBeenCalled();
    });

    it('does not defer calls while playing until a certain call', () => {
      const { fn } = instrument({ fn: jest.fn(() => 'ok') }, { intercept: true });
      global.window.parent.__STORYBOOK_ADDON_TEST_MANAGER__.playUntil = '2-fn';
      /* 1-fn */ expect(fn()).toBe('ok');
      /* 2-fn */ expect(fn()).toBe('ok');
      /* 3-fn */ expect(fn()).toEqual(expect.any(Promise));
      /* 4-fn */ expect(fn()).toEqual(expect.any(Promise));
    });

    it('invokes the deferred function on the "next" event', async () => {
      const { fn } = instrument({ fn: jest.fn(() => 'bar') }, { intercept: true });
      const promise = fn('foo');
      addons.getChannel().emit(EVENTS.NEXT);
      expect(await promise).toBe('bar');
      expect(fn._original).toHaveBeenCalledWith('foo');
    });

    it('resolves all pending promises on the "next" event', async () => {
      const { fn } = instrument({ fn: jest.fn(() => {}) }, { intercept: true });
      const promise = Promise.all([fn(), fn()]);
      addons.getChannel().emit(EVENTS.NEXT);
      await promise;
      expect(fn._original).toHaveBeenCalledTimes(2);
    });
  });
});
