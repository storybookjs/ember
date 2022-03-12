import type { StorybookConfigOptions } from '@storybook/core-common';
import { once } from '@storybook/node-logger';

// addons/x is for the monorepo
const packageRe = /addon(s\/|-)(docs|controls)/;

export const hasDocsOrControls = (options: StorybookConfigOptions) => {
  const found = options.presetsList?.some((preset) => packageRe.test(preset.name));
  if (!found) {
    once.verbose(
      `No docs or controls found in presets: ${options.presetsList?.map((preset) => preset.name)}`
    );
  }
  return found;
};
