import path from 'path';
import { getInterpretedFile, serverRequire, Options } from '@storybook/core-common';

export async function getManagerBuilder(configDir: Options['configDir']) {
  const main = path.resolve(configDir, 'main');
  const mainFile = getInterpretedFile(main);
  const { core } = mainFile ? serverRequire(mainFile) : { core: null };

  const builderName = typeof core?.builder === 'string' ? core.builder : core?.builder?.name;

  // Builder can be any string including community builders like `storybook-builder-vite`.
  // - For now, `webpack5` triggers `manager-webpack5`
  // - Everything else builds with `manager-webpack4`
  //
  // Unlike preview builders, manager building is not pluggable!
  const builderPackage =
    builderName === 'webpack5'
      ? require.resolve('@storybook/manager-webpack5', { paths: [main] })
      : '@storybook/manager-webpack4';

  const managerBuilder = await import(builderPackage);
  return managerBuilder;
}
