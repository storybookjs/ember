import type { PackageJson } from '@storybook/core-common';

export type { PackageJson } from '@storybook/core-common';
export type PackageJsonWithDepsAndDevDeps = PackageJson &
  Required<Pick<PackageJson, 'dependencies' | 'devDependencies'>>;
