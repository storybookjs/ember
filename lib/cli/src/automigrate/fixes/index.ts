import { cra5 } from './cra5';
import { webpack5 } from './webpack5';
import { angular12 } from './angular12';
import { vue3 } from './vue3';
import { mainjsFramework } from './mainjsFramework';
import { eslintPlugin } from './eslint-plugin';
import { builderVite } from './builder-vite';
import { Fix } from '../types';

export * from '../types';
export const fixes: Fix[] = [
  cra5,
  webpack5,
  angular12,
  vue3,
  mainjsFramework,
  eslintPlugin,
  builderVite,
];
