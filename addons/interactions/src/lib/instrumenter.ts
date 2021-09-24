/* eslint-disable no-underscore-dangle */
import { addons, Channel } from '@storybook/addons';
import {
  FORCE_REMOUNT,
  IGNORED_EXCEPTION,
  STORY_RENDER_PHASE_CHANGED,
} from '@storybook/core-events';
import global from 'global';

import { Call, CallRef, CallStates, LogItem } from '../types';

export const EVENTS = {
  CALL: 'instrumenter/call',
  SYNC: 'instrumenter/sync',
  LOCK: 'instrumenter/lock',
  START: 'instrumenter/start',
  BACK: 'instrumenter/back',
  GOTO: 'instrumenter/goto',
  NEXT: 'instrumenter/next',
  END: 'instrumenter/end',
};

export interface Options {
  intercept?: boolean | ((method: string, path: Array<string | CallRef>) => boolean);
  retain?: boolean;
  mutate?: boolean;
  path?: Array<string | CallRef>;
}

export interface State {
  isDebugging: boolean;
  cursor: number;
  calls: Call[];
  shadowCalls: Call[];
  callRefsByResult: Map<any, CallRef>;
  chainedCallIds: Set<Call['id']>;
  parentCallId?: Call['id'];
  playUntil?: Call['id'];
  resolvers: Record<Call['id'], Function>;
  syncTimeout: ReturnType<typeof setTimeout>;
  forwardedException?: Error;
}

export type PatchedObj<TObj> = {
  [Property in keyof TObj]: TObj[Property] & { _original: PatchedObj<TObj> };
};

const getInitialState = (): State =>
  Object.freeze({
    isDebugging: false,
    cursor: 0,
    calls: [],
    shadowCalls: [],
    callRefsByResult: new Map(),
    chainedCallIds: new Set<Call['id']>(),
    parentCallId: undefined,
    playUntil: undefined,
    resolvers: {},
    syncTimeout: undefined,
    forwardedException: undefined,
  });

const isObject = (o: unknown) => Object.prototype.toString.call(o) === '[object Object]';
const isModule = (o: unknown) => Object.prototype.toString.call(o) === '[object Module]';
const isInstrumentable = (o: unknown) => {
  if (!isObject(o) && !isModule(o)) return false;
  if (o.constructor === undefined) return true;
  const proto = o.constructor.prototype;
  if (!isObject(proto)) return false;
  if (Object.prototype.hasOwnProperty.call(proto, 'isPrototypeOf') === false) return false;
  return true;
};

const construct = (obj: any) => {
  try {
    return new obj.constructor();
  } catch (e) {
    return {};
  }
};

export class Instrumenter {
  channel: Channel;

  state: State;

  constructor() {
    this.channel = addons.getChannel();
    this.state = getInitialState();

    // When called from `start`, isDebugging will be true
    const resetState = ({ isDebugging = false } = {}) => {
      const { calls, shadowCalls, callRefsByResult, chainedCallIds, playUntil } = this.state;
      const retainedCalls = (isDebugging ? shadowCalls : calls).filter((call) => call.retain);
      const retainedCallRefs = new Map(
        Array.from(callRefsByResult.entries()).filter(([, ref]) => {
          return retainedCalls.some((call) => call.id === ref.__callId__);
        })
      );

      this.setState({
        ...getInitialState(),
        cursor: retainedCalls.length,
        calls: retainedCalls,
        callRefsByResult: retainedCallRefs,
        shadowCalls: isDebugging ? shadowCalls : [],
        chainedCallIds: isDebugging ? chainedCallIds : new Set<Call['id']>(),
        playUntil: isDebugging ? playUntil : undefined,
        isDebugging,
      });

      // Don't sync while debugging, as it'll cause flicker.
      if (!isDebugging) this.channel.emit(EVENTS.SYNC, this.getLog());
    };

    // A forceRemount might be triggered for debugging (on `start`), or elsewhere in Storybook.
    this.channel.on(FORCE_REMOUNT, resetState);

    // Start with a clean slate before playing, but also clean up when switching to a story that
    // doesn't have a play function (in which case there is no 'playing' phase).
    // Invocation of the play function is guaranteed to always be preceded by the 'rendering' phase.
    this.channel.on(STORY_RENDER_PHASE_CHANGED, ({ storyId, newPhase }) => {
      // TODO keep state per story
      if (newPhase === 'loading') resetState({ isDebugging: this.state.isDebugging });
      if (newPhase === 'completed') {
        this.setState({ isDebugging: false });
      }
    });

    const start = ({ storyId, playUntil }: { storyId: string; playUntil?: Call['id'] }) => {
      if (!this.state.isDebugging) {
        this.setState(({ calls }) => ({
          calls: [],
          shadowCalls: calls.map((call) => ({ ...call, state: CallStates.PENDING })),
          isDebugging: true,
        }));
      }

      const log = this.getLog();
      const firstRowIndex = this.state.shadowCalls.findIndex((call) => call.id === log[0].callId);
      this.setState(({ shadowCalls }) => ({
        playUntil:
          playUntil ||
          shadowCalls
            .slice(0, firstRowIndex)
            .filter((call) => call.interceptable)
            .slice(-1)[0]?.id,
      }));

      this.channel.emit(FORCE_REMOUNT, { storyId, isDebugging: true });
      // TODO deal with full page reload
      // global.window.location.reload();
    };

    const back = ({ storyId }: { storyId: string }) => {
      const { isDebugging } = this.state;
      const log = this.getLog();
      const next = log.findIndex(({ state }) => state === CallStates.PENDING);
      const playUntil = log[next - 2]?.callId || (isDebugging ? null : log.slice(-2)[0]?.callId);
      start({ storyId, playUntil });
    };

    const goto = ({ storyId, callId }: { storyId: string; callId: Call['id'] }) => {
      const { calls, shadowCalls, resolvers } = this.state;
      const call = calls.find(({ id }) => id === callId);
      const shadowCall = shadowCalls.find(({ id }) => id === callId);
      if (!call && shadowCall) {
        const nextCallId = this.getLog().find(({ state }) => state === CallStates.PENDING)?.callId;
        if (shadowCall.id !== nextCallId) this.setState({ playUntil: shadowCall.id });
        Object.values(resolvers).forEach((resolve) => resolve());
      } else {
        start({ storyId, playUntil: callId });
      }
    };

    const next = () => {
      Object.values(this.state.resolvers).forEach((resolve) => resolve());
    };

    const end = () => {
      this.setState({ playUntil: undefined, isDebugging: false });
      Object.values(this.state.resolvers).forEach((resolve) => resolve());
    };

    this.channel.on(EVENTS.START, start);
    this.channel.on(EVENTS.BACK, back);
    this.channel.on(EVENTS.GOTO, goto);
    this.channel.on(EVENTS.NEXT, next);
    this.channel.on(EVENTS.END, end);
  }

  setState(update: Partial<State> | ((state: State) => Partial<State>)) {
    this.state = {
      ...this.state,
      ...(typeof update === 'function' ? update(this.state) : update),
    };
  }

  getLog(): LogItem[] {
    const merged = [...this.state.shadowCalls];
    this.state.calls.forEach((call, index) => {
      merged[index] = call;
    });

    const seen = new Set();
    return merged.reduceRight<LogItem[]>((acc, call) => {
      call.args.forEach((arg) => {
        if (arg?.__callId__) {
          seen.add(arg.__callId__);
        }
      });
      call.path.forEach((node) => {
        if ((node as CallRef).__callId__) {
          seen.add((node as CallRef).__callId__);
        }
      });
      if (call.interceptable && !seen.has(call.id) && !seen.has(call.parentId)) {
        acc.unshift({ callId: call.id, state: call.state });
        seen.add(call.id);
        if (call.parentId) {
          seen.add(call.parentId);
        }
      }
      return acc;
    }, []);
  }

  // Traverses the object structure to recursively patch all function properties.
  // Returns the original object, or a new object with the same constructor,
  // depending on whether it should mutate.
  instrument<TObj extends { [x: string]: any }>(
    obj: TObj,
    options: Options = {}
  ): PatchedObj<TObj> {
    if (!isInstrumentable(obj)) return obj;

    const { mutate = false, path = [] } = options;
    return Object.keys(obj).reduce(
      (acc, key) => {
        const value = (obj as Record<string, any>)[key];

        // Nothing to patch, but might be instrumentable, so we recurse
        if (typeof value !== 'function') {
          acc[key] = this.instrument(value, { ...options, path: path.concat(key) });
          return acc;
        }

        // Already patched, so we pass through unchanged
        if (typeof value._original === 'function') {
          acc[key] = value;
          return acc;
        }

        // Patch the function and mark it "patched" by adding a reference to the original function
        acc[key] = this.patch(key, value, options);
        acc[key]._original = value;

        // Deal with functions that also act like an object
        if (Object.keys(value).length > 0) {
          Object.assign(
            acc[key],
            this.instrument({ ...value }, { ...options, path: path.concat(key) })
          );
        }

        return acc;
      },
      mutate ? obj : construct(obj)
    );
  }

  patch(method: string, fn: Function, options: Options) {
    const patched = (...args: any[]) => this.track(method, fn, args, options);
    Object.defineProperty(patched, 'name', { value: method, writable: false });
    return patched;
  }

  // Monkey patch an object method to record calls.
  // Returns a function that invokes the original function, records the invocation ("call") and
  // returns the original result.
  track(method: string, fn: Function, args: any[], { path = [], ...options }: Options) {
    const index = this.state.cursor;
    this.setState({ cursor: this.state.cursor + 1 });
    const id = `${index}-${method}`;
    const { intercept = false, retain = false } = options;
    const interceptable = typeof intercept === 'function' ? intercept(method, path) : intercept;
    const call: Call = { id, path, method, args, interceptable, retain };
    const result = (interceptable ? this.intercept : this.invoke).call(this, fn, call);
    return this.instrument(result, { ...options, mutate: true, path: [{ __callId__: call.id }] });
  }

  intercept(fn: Function, call: Call) {
    // For a "jump to step" action, continue playing until we hit a call by that ID.
    // For chained calls, we can only return a Promise for the last call in the chain.
    const isChainedUpon = this.state.chainedCallIds.has(call.id);
    if (!this.state.isDebugging || isChainedUpon || this.state.playUntil) {
      if (this.state.playUntil === call.id) {
        this.setState({ playUntil: undefined });
      }
      return this.invoke(fn, call);
    }

    // Instead of invoking the function, defer the function call until we continue playing.
    return new Promise((resolve) => {
      this.setState(({ resolvers }) => ({ resolvers: { ...resolvers, [call.id]: resolve } }));
    }).then(() => {
      const { [call.id]: _, ...resolvers } = this.state.resolvers;
      this.setState({ resolvers });
      return this.invoke(fn, call);
    });
  }

  invoke(fn: Function, call: Call) {
    const info: Call = {
      ...call,
      parentId: this.state.parentCallId,
      // Map args that originate from a tracked function call to a call reference to enable nesting.
      // These values are often not fully serializable anyway (e.g. HTML elements).
      args: call.args.map((arg) => {
        if (this.state.callRefsByResult.has(arg)) {
          return this.state.callRefsByResult.get(arg);
        }
        if (arg instanceof global.window.HTMLElement) {
          const { prefix, localName, id, classList, innerText } = arg;
          const classNames = Array.from(classList);
          return { __element__: { prefix, localName, id, classNames, innerText } };
        }
        return arg;
      }),
    };

    // Mark any ancestor calls as "chained upon" so we won't attempt to defer it later.
    call.path.forEach((ref: any) => {
      if (ref?.__callId__) {
        this.setState(({ chainedCallIds }) => ({
          chainedCallIds: new Set(Array.from(chainedCallIds).concat(ref.__callId__)),
        }));
      }
    });

    const handleException = (e: unknown) => {
      if (e instanceof Error) {
        const { name, message, stack } = e;
        const exception = { name, message, stack, callId: call.id };
        this.sync({ ...info, state: CallStates.ERROR, exception });

        // Always track errors to their originating call.
        this.setState(({ callRefsByResult }) => ({
          callRefsByResult: new Map([
            ...Array.from(callRefsByResult.entries()),
            [e, { __callId__: call.id }],
          ]),
        }));

        // We need to throw to break out of the play function, but we don't want to trigger a redbox
        // so we throw an ignoredException, which is caught and silently ignored by Storybook.
        if (call.interceptable) {
          throw IGNORED_EXCEPTION;
        }

        // Non-interceptable calls need their exceptions forwarded to the next interceptable call.
        // TODO what if there is no next interceptable call?
        this.setState({ forwardedException: e });
        return e;
      }
      throw e;
    };

    try {
      // An earlier, non-interceptable call might have forwarded an exception.
      if (this.state.forwardedException) {
        throw this.state.forwardedException;
      }

      const result = fn(
        // Wrap any callback functions to provide a way to access their "parent" call.
        ...call.args.map((arg: any) => {
          if (typeof arg !== 'function' || Object.keys(arg).length) return arg;
          return (...args: any) => {
            const prev = this.state.parentCallId;
            this.setState({ parentCallId: call.id });
            const res = arg(...args);
            this.setState({ parentCallId: prev });
            return res;
          };
        })
      );
      this.sync({ ...info, state: CallStates.DONE });

      // Track the result so we can trace later uses of it back to the originating call.
      // Primitive results (undefined, null, boolean, string, number, BigInt) are ignored.
      if (result && ['object', 'function', 'symbol'].includes(typeof result)) {
        this.setState(({ callRefsByResult }) => ({
          callRefsByResult: new Map([
            ...Array.from(callRefsByResult.entries()),
            [result, { __callId__: call.id }],
          ]),
        }));
      }

      if (result instanceof Promise) {
        // Lock the debugger UI while we're waiting for the action to be performed.
        this.channel.emit(EVENTS.LOCK, true);
        // Rejected promises are handled like any other exception.
        return result.then(() => this.channel.emit(EVENTS.LOCK, false)).catch(handleException);
      }

      return result;
    } catch (e) {
      return handleException(e);
    }
  }

  sync(call: Call) {
    clearTimeout(this.state.syncTimeout);
    this.setState(({ calls }) => ({ calls: calls.concat(call) }));
    this.channel.emit(EVENTS.CALL, call);
    this.state.syncTimeout = setTimeout(() => this.channel.emit(EVENTS.SYNC, this.getLog()), 0);
  }
}

export const instrument = <TObj extends Record<string, any>>(obj: TObj, options: Options = {}) => {
  if (!global.window.__STORYBOOK_ADDON_INTERACTIONS_INSTRUMENTER__) {
    global.window.__STORYBOOK_ADDON_INTERACTIONS_INSTRUMENTER__ = new Instrumenter();
  }
  const instrumenter: Instrumenter = global.window.__STORYBOOK_ADDON_INTERACTIONS_INSTRUMENTER__;
  return instrumenter.instrument(obj, options);
};
