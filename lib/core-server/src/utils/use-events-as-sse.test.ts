import { Request, Response } from 'express';
import EventEmitter from 'events';

import { useEventsAsSSE } from './use-events-as-sse';

jest.useFakeTimers();

const mockResponse = () =>
  (({
    writableEnded: false,
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    flush: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  } as unknown) as Response);

const sseRequest = ({ headers: { accept: 'text/event-stream' } } as unknown) as Request;

describe('useEventsAsSSE', () => {
  it('does nothing if the request is NOT an event stream', () => {
    const emitter = new EventEmitter();
    const eventsAsSSE = useEventsAsSSE(emitter, ['event-1', 'event-2']);
    const req = { headers: {} } as Request;
    expect(eventsAsSSE(req, mockResponse())).toEqual(false);
  });

  it('sends a PING every 1 second', () => {
    const emitter = new EventEmitter();
    const eventsAsSSE = useEventsAsSSE(emitter, ['event-1', 'event-2']);
    const res = mockResponse();
    expect(eventsAsSSE(sseRequest, res)).toEqual(true);

    jest.runOnlyPendingTimers();

    expect(res.write).toHaveBeenCalledWith('event:PING\ndata:\n\n');
    expect(res.flush).toHaveBeenCalled();
  });

  it('stops PINGing when the response closes', () => {
    const emitter = new EventEmitter();
    const eventsAsSSE = useEventsAsSSE(emitter, ['event-1', 'event-2']);
    const res = mockResponse();
    expect(eventsAsSSE(sseRequest, res)).toEqual(true);

    (res.on as jest.Mock).mock.calls[0][1]();
    jest.runOnlyPendingTimers();

    expect(res.write).not.toHaveBeenCalled();
    expect(res.flush).not.toHaveBeenCalled();
  });

  it('sends event data for specified events', () => {
    const emitter = new EventEmitter();
    const eventsAsSSE = useEventsAsSSE(emitter, ['event-1', 'event-2']);
    const res = mockResponse();
    expect(eventsAsSSE(sseRequest, res)).toEqual(true);

    emitter.emit('event-1', { some: 'data' });
    expect(res.write).toHaveBeenCalledWith('event:event-1\ndata:{"some":"data"}\n\n');
    expect(res.flush).toHaveBeenCalledTimes(1);

    emitter.emit('event-2');
    expect(res.write).toHaveBeenCalledWith('event:event-2\ndata:\n\n');
    expect(res.flush).toHaveBeenCalledTimes(2);

    (res.write as jest.Mock).mockClear();
    emitter.emit('event-3');
    expect(res.write).not.toHaveBeenCalled();
    expect(res.flush).toHaveBeenCalledTimes(2);
  });

  it('stops sending event data when request closes', () => {
    const emitter = new EventEmitter();
    const eventsAsSSE = useEventsAsSSE(emitter, ['event-1', 'event-2']);
    const res = mockResponse();
    expect(eventsAsSSE(sseRequest, res)).toEqual(true);

    (res.on as jest.Mock).mock.calls[0][1]();

    emitter.emit('event-1', { some: 'data' });
    expect(res.write).not.toHaveBeenCalled();
    expect(res.flush).not.toHaveBeenCalled();
  });
});
