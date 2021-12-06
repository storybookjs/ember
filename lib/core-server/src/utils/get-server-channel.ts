import { Socket } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import { stringify } from 'telejson';

type Server = ConstructorParameters<typeof WebSocketServer>[0]['server'];

export class ServerChannel {
  webSocketServer: WebSocketServer;

  constructor(server: Server) {
    this.webSocketServer = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/storybook-server-channel') {
        // Cast can be removed once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/57590 is released.
        this.webSocketServer.handleUpgrade(request, socket as Socket, head, (ws) => {
          this.webSocketServer.emit('connection', ws, request);
        });
      }
    });
  }

  emit(type: string, args: any[] = []) {
    const event = { type, args };
    const data = stringify(event, { maxDepth: 15, allowFunction: true });
    Array.from(this.webSocketServer.clients)
      .filter((c) => c.readyState === WebSocket.OPEN)
      .forEach((client) => client.send(data));
  }
}

export function getServerChannel(server: Server) {
  return new ServerChannel(server);
}
