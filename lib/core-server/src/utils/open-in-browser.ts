import { logger } from '@storybook/node-logger';
import betterOpn from 'better-opn'; // betterOpn alias used because also loading open
import open from 'open';
import getDefaultBrowser from 'x-default-browser';
import dedent from 'ts-dedent';

export function openInBrowser(address: string) {
  const defaultBrowserCallback = async (err: any, res: any) => {
    if (res.isFirefox) {
      // Handle firefox cross-browser using open's system-specific binary utility.
      // See https://github.com/sindresorhus/open#openapps for more information.
      try {
        await open(address, {
          app: {
            name: 'firefox',
          },
        });
      } catch (error) {
        logger.error(dedent`
          Could not open ${address} inside a browser. If you're running this command inside a
          docker container or on a CI, you need to pass the '--ci' flag to prevent opening a
          browser by default.
        `);
      }
    } else {
      if (res.isSafari) {
        // If Safari, set BROWSER env variable to leverage better-opn built-in override.
        // See https://github.com/michaellzc/better-opn#usage for more information.
        process.env.BROWSER = 'safari';
      }

      try {
        betterOpn(address);
      } catch (error) {
        logger.error(dedent`
          Could not open ${address} inside a browser. If you're running this command inside a
          docker container or on a CI, you need to pass the '--ci' flag to prevent opening a
          browser by default.
        `);
      }
    }
  };

  getDefaultBrowser(defaultBrowserCallback);
}
