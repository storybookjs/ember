import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema } from '@angular-devkit/core';
import * as path from 'path';

const buildStandaloneMock = jest.fn().mockImplementation((_options: unknown) => Promise.resolve());

jest.doMock('@storybook/angular/standalone', () => buildStandaloneMock);

describe('Build Storybook Builder', () => {
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
    const run = await architect.scheduleBuilder('@storybook/angular:build-storybook', {
      browserTarget: 'angular-cli:build-2',
    });

    const output = await run.result;

    await run.stop();

    expect(output.success).toBeTruthy();
    expect(buildStandaloneMock).toHaveBeenCalledWith({
      angularBrowserTarget: 'angular-cli:build-2',
      browserTarget: 'angular-cli:build-2',
      configDir: '.storybook',
      docs: false,
      loglevel: undefined,
      quiet: false,
      outputDir: 'storybook-static',
      staticDir: [],
      mode: 'static',
    });
  });
});
