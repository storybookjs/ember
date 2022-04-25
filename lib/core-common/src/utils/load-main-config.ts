import path from 'path';
import { serverRequire } from './interpret-require';
import { validateConfigurationFiles } from './validate-configuration-files';
import { StorybookConfig } from '../types';

export function loadMainConfig({ configDir }: { configDir: string }): StorybookConfig {
  validateConfigurationFiles(configDir);

  return serverRequire(path.resolve(configDir, 'main'));
}
