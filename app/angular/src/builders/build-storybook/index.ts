import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { from, Observable, of } from 'rxjs';
import { CLIOptions } from '@storybook/core-common';
import { map, switchMap } from 'rxjs/operators';

// eslint-disable-next-line import/no-extraneous-dependencies
import buildStandalone, { StandaloneOptions } from '@storybook/angular/standalone';

export type StorybookBuilderOptions = JsonObject & {
  browserTarget: string;
} & Pick<
    // makes sure the option exists
    CLIOptions,
    'staticDir' | 'outputDir' | 'configDir' | 'loglevel' | 'quiet' | 'docs'
  >;

export type StorybookBuilderOutput = JsonObject & BuilderOutput & {};

export default createBuilder(commandBuilder);

function commandBuilder(
  options: StorybookBuilderOptions,
  _context: BuilderContext
): Observable<StorybookBuilderOutput> {
  return of({}).pipe(
    map(() => ({
      ...options,
      angularBrowserTarget: options.browserTarget,
    })),
    switchMap((standaloneOptions) => runInstance({ ...standaloneOptions, mode: 'static' })),
    map(() => {
      return { success: true };
    })
  );
}

function runInstance(options: StandaloneOptions) {
  return from(buildStandalone(options));
}
