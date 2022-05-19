import { logger } from '@storybook/node-logger';
import betterOpn from 'better-opn'; // betterOpn alias used because also loading open
import open from 'open';
import getDefaultBrowser from 'x-default-browser';
import dedent from 'ts-dedent';

export function openInBrowser(address: string) {
  getDefaultBrowser(async (err: any, res: any) => {
    try {
      if (res.isChrome || res.isChromium) {
        // We use betterOpn for Chrome because it is better at handling which chrome tab
        // or window the preview loads in.
        betterOpn(address);
      } else {
        await open(address);
      }
    } catch (error) {
      logger.error(dedent`
        Could not open ${address} inside a browser. If you're running this command inside a
        docker container or on a CI, you need to pass the '--ci' flag to prevent opening a
        browser by default.
      `);
    }
  });
}
