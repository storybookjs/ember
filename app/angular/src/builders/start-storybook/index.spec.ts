import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema } from '@angular-devkit/core';
import * as path from 'path';

const buildStandaloneMock = jest.fn().mockImplementation((_options: unknown) => Promise.resolve());

jest.doMock('@storybook/angular/standalone', () => buildStandaloneMock);

describe('Start Storybook Builder', () => {
  let architect: Architect;
  let architectHost: TestingArchitectHost;

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);

    architectHost = new TestingArchitectHost();
    architect = new Architect(architectHost, registry);

    // This will either take a Node package name, or a path to the directory
    // for the package.json file.
    await architectHost.addBuilderFromPackage(path.join(__dirname, '../../..'));
  });

  it('should work', async () => {
    const run = await architect.scheduleBuilder('@storybook/angular:start-storybook', {
      browserTarget: 'angular-cli:build-2',
      port: 4400,
    });

    const output = await run.result;

    await run.stop();

    expect(output.success).toBeTruthy();
    expect(buildStandaloneMock).toHaveBeenCalledWith({
      angularBrowserTarget: 'angular-cli:build-2',
      browserTarget: 'angular-cli:build-2',
      ci: false,
      configDir: '.storybook',
      docs: false,
      host: 'localhost',
      https: false,
      port: 4400,
      quiet: false,
      smokeTest: false,
      sslCa: undefined,
      sslCert: undefined,
      sslKey: undefined,
      staticDir: [],
    });
  });
});
