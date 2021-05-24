import path from 'path';
import { getInterpretedFile, serverRequire, Options } from '@storybook/core-common';

export async function getManagerBuilder(configDir: Options['configDir']) {
  const main = path.resolve(configDir, 'main');
  const mainFile = getInterpretedFile(main);
  const { core } = mainFile ? serverRequire(mainFile) : { core: null };

  const builderPackage =
    core?.builder === 'webpack5' ? '@storybook/manager-webpack5' : '@storybook/manager-webpack4';

  const managerBuilder = await import(builderPackage);
  return managerBuilder;
}
