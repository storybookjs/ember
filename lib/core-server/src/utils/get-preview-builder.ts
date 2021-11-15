import path from 'path';
import { getInterpretedFile, serverRequire, Options } from '@storybook/core-common';

export async function getPreviewBuilder(configDir: Options['configDir']) {
  const main = path.resolve(configDir, 'main');
  const mainFile = getInterpretedFile(main);
  const { core } = mainFile ? serverRequire(mainFile) : { core: null };
  let builderPackage: string;
  if (core) {
    const builderName = typeof core.builder === 'string' ? core.builder : core.builder?.name;
    builderPackage = require.resolve(
      ['webpack4', 'webpack5'].includes(builderName)
        ? `@storybook/builder-${builderName}`
        : builderName,
      { paths: [main] }
    );
  } else {
    builderPackage = require.resolve('@storybook/builder-webpack4');
  }
  const previewBuilder = await import(builderPackage);
  return previewBuilder;
}
