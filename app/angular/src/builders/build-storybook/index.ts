import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
  Target,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { from, Observable, of, throwError } from 'rxjs';
import { CLIOptions } from '@storybook/core-common';
import { catchError, map, mapTo, switchMap } from 'rxjs/operators';

// eslint-disable-next-line import/no-extraneous-dependencies
import buildStandalone, { StandaloneOptions } from '@storybook/angular/standalone';
import { BrowserBuilderOptions } from '@angular-devkit/build-angular';
import { runCompodoc } from '../utils/run-compodoc';
import { buildStandaloneErrorHandler } from '../utils/build-standalone-errors-handler';

export type StorybookBuilderOptions = JsonObject & {
  browserTarget?: string | null;
  tsConfig?: string;
  compodoc: boolean;
  compodocArgs: string[];
} & Pick<
    // makes sure the option exists
    CLIOptions,
    'staticDir' | 'outputDir' | 'configDir' | 'loglevel' | 'quiet' | 'docs'
  >;

export type StorybookBuilderOutput = JsonObject & BuilderOutput & {};

export default createBuilder(commandBuilder);

function commandBuilder(
  options: StorybookBuilderOptions,
  context: BuilderContext
): Observable<StorybookBuilderOutput> {
  return from(setup(options, context)).pipe(
    switchMap(({ tsConfig }) => {
      const runCompodoc$ = options.compodoc
        ? runCompodoc({ compodocArgs: options.compodocArgs, tsconfig: tsConfig }, context).pipe(
            mapTo({ tsConfig })
          )
        : of({});

      return runCompodoc$.pipe(mapTo({ tsConfig }));
    }),
    map(({ tsConfig }) => {
      const { browserTarget, ...otherOptions } = options;

      return {
        ...otherOptions,
        angularBrowserTarget: browserTarget,
        tsConfig,
      };
    }),
    switchMap((standaloneOptions) => runInstance({ ...standaloneOptions, mode: 'static' })),
    map(() => {
      return { success: true };
    })
  );
}

async function setup(options: StorybookBuilderOptions, context: BuilderContext) {
  let browserOptions: (JsonObject & BrowserBuilderOptions) | undefined;
  let browserTarget: Target | undefined;

  if (options.browserTarget) {
    browserTarget = targetFromTargetString(options.browserTarget);
    browserOptions = await context.validateOptions<JsonObject & BrowserBuilderOptions>(
      await context.getTargetOptions(browserTarget),
      await context.getBuilderNameForTarget(browserTarget)
    );
  }

  return {
    tsConfig: options.tsConfig ?? browserOptions.tsConfig ?? undefined,
  };
}

function runInstance(options: StandaloneOptions) {
  return from(buildStandalone(options)).pipe(
    catchError((error: any) => throwError(buildStandaloneErrorHandler(error)))
  );
}
