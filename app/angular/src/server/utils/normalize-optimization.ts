import { OptimizationUnion } from '@angular-devkit/build-angular/src/browser/schema';

import { NormalizedOptimizationOptions } from '@angular-devkit/build-angular/src/utils/normalize-optimization';
import { moduleIsAvailable } from './module-is-available';

const importAngularCliNormalizeOptimization = ():
  | typeof import('@angular-devkit/build-angular/src/utils/normalize-optimization')
  | undefined => {
  // First we look for webpack config according to directory structure of Angular
  // present since the version 7.2.0
  if (moduleIsAvailable('@angular-devkit/build-angular/src/utils/normalize-optimization')) {
    // eslint-disable-next-line global-require
    return require('@angular-devkit/build-angular/src/utils/normalize-optimization');
  }
  return undefined;
};

export const normalizeOptimization = (
  options: OptimizationUnion
): NormalizedOptimizationOptions => {
  if (importAngularCliNormalizeOptimization()) {
    return importAngularCliNormalizeOptimization().normalizeOptimization(options);
  }

  // Best effort to stay compatible with 6.1.*
  return options as any;
};
