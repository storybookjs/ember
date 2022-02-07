import { cra5 } from './cra5';
import { webpack5 } from './webpack5';
import { angular12 } from './angular12';
import { mainjsFramework } from './mainjsFramework';
import { eslintPlugin } from './eslint-plugin';
import { Fix } from '../types';

export * from '../types';
export const fixes: Fix[] = [cra5, webpack5, angular12, mainjsFramework, eslintPlugin];
