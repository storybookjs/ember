import fs from 'fs-extra';
import path from 'path';
import type { PackageJson } from '@storybook/core-common';
import { getProjectRoot } from '@storybook/core-common';

export const monorepoConfigs = {
  Nx: 'nx.json',
  Turborepo: 'turbo.json',
  Lerna: 'lerna.json',
  Rush: 'rush.json',
  Lage: 'lage.config.json',
} as const;

export type MonorepoType = keyof typeof monorepoConfigs | 'Workspaces' | undefined;

export const getMonorepoType = (): MonorepoType => {
  const projectRootPath = getProjectRoot();
  if (!projectRootPath) return undefined;

  const monorepoType = Object.keys(monorepoConfigs).find(
    (monorepo: keyof typeof monorepoConfigs) => {
      const configFile = path.join(projectRootPath, monorepoConfigs[monorepo]);
      return fs.existsSync(configFile);
    }
  ) as MonorepoType;

  if (monorepoType) {
    return monorepoType;
  }
  
  if (!fs.existsSync(path.join(projectRootPath, 'package.json'))) return undefined;

  const packageJson = fs.readJsonSync(path.join(projectRootPath, 'package.json')) as PackageJson;

  if (packageJson?.workspaces) {
    return 'Workspaces';
  }

  return undefined;
};
