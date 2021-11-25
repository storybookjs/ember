import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
  Target,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import {
  BrowserBuilderOptions,
  ExtraEntryPoint,
  StylePreprocessorOptions,
} from '@angular-devkit/build-angular';
import { from, Observable, of } from 'rxjs';
import { CLIOptions } from '@storybook/core-common';
import { map, switchMap, mapTo } from 'rxjs/operators';
import { sync as findUpSync } from 'find-up';

// eslint-disable-next-line import/no-extraneous-dependencies
import buildStandalone, { StandaloneOptions } from '@storybook/angular/standalone';
import { runCompodoc } from '../utils/run-compodoc';
import { buildStandaloneErrorHandler } from '../utils/build-standalone-errors-handler';

export type StorybookBuilderOptions = JsonObject & {
  browserTarget?: string | null;
  tsConfig?: string;
  compodoc: boolean;
  compodocArgs: string[];
  styles?: ExtraEntryPoint[];
  stylePreprocessorOptions?: StylePreprocessorOptions;
} & Pick<
    // makes sure the option exists
    CLIOptions,
    | 'port'
    | 'host'
    | 'configDir'
    | 'https'
    | 'sslCa'
    | 'sslCert'
    | 'sslKey'
    | 'smokeTest'
    | 'ci'
    | 'quiet'
    | 'docs'
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
      const {
        browserTarget,
        stylePreprocessorOptions,
        styles,
        ci,
        configDir,
        docs,
        host,
        https,
        port,
        quiet,
        smokeTest,
        sslCa,
        sslCert,
        sslKey,
      } = options;

      const standaloneOptions: StandaloneOptions = {
        ci,
        configDir,
        docs,
        host,
        https,
        port,
        quiet,
        smokeTest,
        sslCa,
        sslCert,
        sslKey,
        angularBrowserTarget: browserTarget,
        angularBuilderContext: context,
        angularBuilderOptions: {
          ...(stylePreprocessorOptions ? { stylePreprocessorOptions } : {}),
          ...(styles ? { styles } : {}),
        },
        tsConfig,
      };

      return standaloneOptions;
    }),
    switchMap((standaloneOptions) => runInstance(standaloneOptions)),
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
    tsConfig:
      options.tsConfig ??
      findUpSync('tsconfig.json', { cwd: options.configDir }) ??
      browserOptions.tsConfig,
  };
}
function runInstance(options: StandaloneOptions) {
  return new Observable<void>((observer) => {
    // This Observable intentionally never complete, leaving the process running ;)
    buildStandalone(options).then(
      () => observer.next(),
      (error) => observer.error(buildStandaloneErrorHandler(error))
    );
  });
}
