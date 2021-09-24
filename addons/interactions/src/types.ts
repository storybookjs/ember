export interface Call {
  id: string;
  path: Array<string | CallRef>;
  method: string;
  args: any[];
  interceptable: boolean;
  retain: boolean;
  state?: CallState;
  exception?: CaughtException;
  parentId?: Call['id'];
}

export interface CallRef {
  __callId__: Call['id'];
}

export enum CallStates {
  DONE = 'done',
  ERROR = 'error',
  PENDING = 'pending',
}

export type CallState = CallStates.DONE | CallStates.ERROR | CallStates.PENDING;

interface CaughtException {
  callId: Call['id'];
  message: Error['message'];
  stack: Error['stack'];
}

export interface ElementRef {
  __element__: {
    prefix?: string;
    localName: string;
    id?: string;
    classNames?: string[];
    innerText?: string;
  };
}

export interface LogItem {
  callId: Call['id'];
  state: Call['state'];
}
