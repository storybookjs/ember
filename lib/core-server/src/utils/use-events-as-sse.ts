import { Request, Response } from 'express';
import EventEmitter from 'events';

const PING_INTERVAL = 1000;
const PING = 'PING';

export function useEventsAsSSE(emitter: EventEmitter, events: string[]) {
  return (req: Request, res: Response) => {
    if (req.headers.accept !== 'text/event-stream') {
      return false;
    }
    let closed = false;
    function sendEvent(event: string, data?: any) {
      if (closed || res.writableEnded) return;

      if (data) {
        res.write(`event:${event}\ndata:${JSON.stringify(data)}\n\n`);
      } else {
        res.write(`event:${event}\ndata:\n\n`);
      }
      res.flush();
    }

    const watchers: Record<string, (data: any) => void> = events.reduce((acc, event: string) => {
      acc[event] = (data: any) => sendEvent(event, data);
      return acc;
    }, {} as Record<string, (data: any) => void>);

    let interval: ReturnType<typeof setInterval>;
    const close = () => {
      events.forEach((eventName) => {
        emitter.off(eventName, watchers[eventName]);
      });
      clearTimeout(interval);
      closed = true;
      res.end();
    };
    res.on('close', close);

    if (closed || res.writableEnded) return true;
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    events.forEach((eventName) => {
      emitter.on(eventName, watchers[eventName]);
    });

    // Send a PING event every 1s to avoid Chrome timing out the request
    const ping = () => sendEvent(PING);
    interval = setInterval(ping, PING_INTERVAL);

    return true;
  };
}
