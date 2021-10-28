import global from 'global';
import { Provider } from '@storybook/ui';
import { addons, AddonStore, Channel, Config, Types } from '@storybook/addons';
import createPostMessageChannel from '@storybook/channel-postmessage';
import createWebSocketChannel from '@storybook/channel-websocket';
import Events from '@storybook/core-events';

const { FEATURES, document } = global;

export default class ReactProvider extends Provider {
  private addons: AddonStore;

  private channel: Channel;

  private serverChannel?: Channel;

  constructor() {
    super();

    const channel = createPostMessageChannel({ page: 'manager' });

    addons.setChannel(channel);
    channel.emit(Events.CHANNEL_CREATED);

    this.addons = addons;
    this.channel = channel;

    if (FEATURES?.storyStoreV7) {
      // TODO--how to construct URL?
      const serverChannel = createWebSocketChannel({
        url: `ws://${document.location.hostname}:${document.location.port}/`,
        async: false,
        onError: console.error.bind(console),
      });
      this.serverChannel = serverChannel;
      addons.setServerChannel(this.serverChannel);
    }
  }

  getElements(type: Types) {
    return this.addons.getElements(type);
  }

  getConfig(): Config {
    return this.addons.getConfig();
  }

  handleAPI(api: unknown) {
    this.addons.loadAddons(api);
  }
}
