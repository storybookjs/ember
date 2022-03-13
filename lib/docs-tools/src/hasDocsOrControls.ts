import type { StorybookConfigOptions } from '@storybook/core-common';

// addons/x is for the monorepo
const packageRe = /addon(s\/|-)(docs|controls)/;

export const hasDocsOrControls = (options: StorybookConfigOptions) =>
  options.presetsList?.some((preset) => packageRe.test(preset.name));
