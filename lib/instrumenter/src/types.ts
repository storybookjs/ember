import { StoryId } from '@storybook/addons';

export interface Call {
  id: string;
  path: Array<string | CallRef>;
  method: string;
  storyId: StoryId;
  args: any[];
  interceptable: boolean;
  retain: boolean;
  state?: CallStates.DONE | CallStates.ERROR | CallStates.ACTIVE | CallStates.WAITING;
  exception?: {
    callId: Call['id'];
    message: Error['message'];
    stack: Error['stack'];
  };
  parentId?: Call['id'];
}

export enum CallStates {
  DONE = 'done',
  ERROR = 'error',
  ACTIVE = 'active',
  WAITING = 'waiting',
}

export interface CallRef {
  __callId__: Call['id'];
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
