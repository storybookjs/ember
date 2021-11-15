import { StoryId } from '@storybook/addons';

export interface Call {
  id: string;
  parentId?: Call['id'];
  storyId: StoryId;
  cursor: number;
  path: Array<string | CallRef>;
  method: string;
  args: any[];
  interceptable: boolean;
  retain: boolean;
  status?: CallStates.DONE | CallStates.ERROR | CallStates.ACTIVE | CallStates.WAITING;
  exception?: Error;
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
  status: Call['status'];
}
