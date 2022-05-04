import path from 'path';
import fs from 'fs';
import type { PackageJson } from '@storybook/core-common';

export function readPackageJson(): PackageJson {
  const packageJsonPath = path.resolve('package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Could not read package.json file at ${packageJsonPath}`);
  }

  const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(jsonContent);
}

export function writePackageJson(packageJson: PackageJson) {
  const content = `${JSON.stringify(packageJson, null, 2)}\n`;
  const packageJsonPath = path.resolve('package.json');

  fs.writeFileSync(packageJsonPath, content, 'utf8');
}
