export interface Call {
  id: string;
  path: Array<string | CallRef>;
  method: string;
  args: any[];
  interceptable: boolean;
  retain: boolean;
  state?: `${CallState}`;
  exception?: CaughtException;
}

export interface CallRef {
  __callId__: Call['id'];
  retain?: boolean;
}

export enum CallState {
  DONE = 'done',
  ERROR = 'error',
  PENDING = 'pending',
}

interface CaughtException {
  callId: Call['id'];
  message: Error['message'];
  stack: Error['stack'];
}
