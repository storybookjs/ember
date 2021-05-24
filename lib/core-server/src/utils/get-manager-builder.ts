import path from 'path';
import { getInterpretedFile, serverRequire, Options } from '@storybook/core-common';

export async function getManagerBuilder(configDir: Options['configDir']) {
  const main = path.resolve(configDir, 'main');
  const mainFile = getInterpretedFile(main);
  const { core } = mainFile ? serverRequire(mainFile) : { core: null };

  // Builder can be any string including community builders like `storybook-builder-vite`.
  // - For now, `webpack5` triggers `manager-webpack5.
  // - Everything else builds with `manager-webpack4`.
  const builderPackage =
    core?.builder === 'webpack5' ? '@storybook/manager-webpack5' : '@storybook/manager-webpack4';

  const managerBuilder = await import(builderPackage);
  return managerBuilder;
}
