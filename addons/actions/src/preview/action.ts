import uuidv4 from 'uuid-browser/v4';
import { addons } from '@storybook/addons';
import { EVENT_ID } from '../constants';
import { ActionDisplay, ActionOptions, HandlerFunction } from '../models';
import { config } from './configureActions';

type SyntheticEvent = any; // import('react').SyntheticEvent;
const protoWithName = (obj: unknown, name: string): Function | null => {
  const proto = Object.getPrototypeOf(obj);
  if (!proto || proto.constructor.name === name) return proto;
  return protoWithName(proto, name);
};
const isReactSyntheticEvent = (e: unknown): e is SyntheticEvent =>
  Boolean(
    typeof e === 'object' &&
      e &&
      protoWithName(e, 'SyntheticEvent') &&
      typeof (e as SyntheticEvent).persist === 'function'
  );
const serializeArg = <T>(a: T) => {
  if (isReactSyntheticEvent(a)) {
    const e: SyntheticEvent = Object.create(
      a.constructor.prototype,
      Object.getOwnPropertyDescriptors(a)
    );
    e.persist();
    const viewDescriptor = Object.getOwnPropertyDescriptor(e, 'view');
    // dont send the entire window object over.
    const view: unknown = viewDescriptor?.value;
    if (typeof view === 'object' && view?.constructor.name === 'Window') {
      Object.defineProperty(e, 'view', {
        ...viewDescriptor,
        value: Object.create(view.constructor.prototype),
      });
    }
    return e;
  }
  return a;
};

export function action(name: string, options: ActionOptions = {}): HandlerFunction {
  const actionOptions = {
    ...config,
    ...options,
  };

  const handler = function actionHandler(...args: any[]) {
    const channel = addons.getChannel();
    const id = uuidv4();
    const minDepth = 5; // anything less is really just storybook internals
    const serializedArgs = args.map(serializeArg);
    const normalizedArgs = args.length > 1 ? serializedArgs : serializedArgs[0];

    const actionDisplayToEmit: ActionDisplay = {
      id,
      count: 0,
      data: { name, args: normalizedArgs },
      options: {
        ...actionOptions,
        maxDepth: minDepth + (actionOptions.depth || 3),
        allowFunction: actionOptions.allowFunction || false,
      },
    };
    channel.emit(EVENT_ID, actionDisplayToEmit);
  };

  return handler;
}
