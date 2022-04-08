import path from 'path';
import { StorybookConfig } from '@storybook/core-common';
import { hasDocsOrControls } from '@storybook/docs-tools';

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entry = [], options) => {
  if (!hasDocsOrControls(options)) return entry;
  return [...entry, path.join(__dirname, '../../../dist/ts3.9/client/docs/config')];
};
