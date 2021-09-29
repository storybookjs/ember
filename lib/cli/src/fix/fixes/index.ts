import { cra5 } from './cra5';
import { webpack5 } from './webpack5';
import { Fix } from '../types';

export * from '../types';
export const fixes: Fix[] = [cra5, webpack5];
