const { logger } = require('@storybook/node-logger');

export type OptionsEntry = { name: string };
export type AddonEntry = string | OptionsEntry;
export type AddonInfo = { name: string; inEssentials: boolean };

interface Options {
  before: AddonInfo;
  after: AddonInfo;
  configFile: string;
  getConfig: (path: string) => any;
}

const predicateFor = (addon: string) => (entry: AddonEntry) => {
  const name = (entry as OptionsEntry).name || (entry as string);
  return name && name.includes(addon);
};

const isCorrectOrder = (addons: AddonEntry[], before: AddonInfo, after: AddonInfo) => {
  const essentialsIndex = addons.findIndex(predicateFor('@storybook/addon-essentials'));
  let beforeIndex = addons.findIndex(predicateFor(before.name));
  let afterIndex = addons.findIndex(predicateFor(after.name));
  if (beforeIndex === -1 && before.inEssentials) beforeIndex = essentialsIndex;
  if (afterIndex === -1 && after.inEssentials) afterIndex = essentialsIndex;
  return beforeIndex !== -1 && afterIndex !== -1 && beforeIndex <= afterIndex;
};

export const checkAddonOrder = async ({ before, after, configFile, getConfig }: Options) => {
  try {
    const config = await getConfig(configFile);

    if (!config?.addons) {
      logger.warn(`Unable to find 'addons' config in main Storybook config`);
      return;
    }

    if (!isCorrectOrder(config.addons, before, after)) {
      const orEssentials = " (or '@storybook/addon-essentials')";
      const beforeText = `'${before.name}'${before.inEssentials ? orEssentials : ''}`;
      const afterText = `'${after.name}'${after.inEssentials ? orEssentials : ''}`;
      logger.warn(
        `Expected ${beforeText} to be listed before ${afterText} in main Storybook config.`
      );
    }
  } catch (e) {
    logger.warn(`Unable to load config file: ${configFile}`);
  }
};
