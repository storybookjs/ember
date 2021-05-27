import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of } from 'rxjs';
import { CLIOptions } from '@storybook/core-common';
import { map, switchMap, tap } from 'rxjs/operators';

// TODO: find a better way 🤷‍♂️
// eslint-disable-next-line import/no-extraneous-dependencies
import buildStandalone, { StandaloneOptions } from '@storybook/angular/standalone';

export type StorybookBuilderOptions = JsonObject & {
  browserTarget: string;
} & Pick<
    // makes sure the option exists
    CLIOptions,
    | 'port'
    | 'host'
    | 'staticDir'
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
  _context: BuilderContext
): Observable<StorybookBuilderOutput> {
  return of({}).pipe(
    map(() => ({
      ...options,
      angularBrowserTarget: options.browserTarget,
    })),
    switchMap((standaloneOptions) => runInstance(standaloneOptions)),
    map(() => {
      return { success: true };
    })
  );
}

function runInstance(options: StandaloneOptions) {
  return new Observable<unknown>((obs) => {
    buildStandalone({ ...options })
      .then((sucess: unknown) => obs.next(sucess))
      .catch((err: unknown) => obs.error(err));
  });
}
