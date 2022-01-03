import { BuilderContext } from '@angular-devkit/architect';
import { LoggerApi } from '@angular-devkit/core/src/logger';
import { take } from 'rxjs/operators';

const cpSpawnMock = {
  spawn: jest.fn(),
};
jest.doMock('child_process', () => cpSpawnMock);

const { runCompodoc } = require('./run-compodoc');

const builderContextLoggerMock: LoggerApi = {
  createChild: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
};

describe('runCompodoc', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { FOO: 'bar' };
    cpSpawnMock.spawn.mockImplementation(() => ({
      stdout: { on: () => {} },
      stderr: { on: () => {} },
      on: (_event: string, cb: any) => cb(0),
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should run compodoc with tsconfig from context', async () => {
    runCompodoc(
      {
        compodocArgs: [],
        tsconfig: 'path/to/tsconfig.json',
      },
      {
        workspaceRoot: 'path/to/project',
        logger: builderContextLoggerMock,
      } as BuilderContext
    )
      .pipe(take(1))
      .subscribe();

    expect(cpSpawnMock.spawn).toHaveBeenCalledWith(
      'npx',
      ['compodoc', '-p', 'path/to/tsconfig.json', '-d', 'path/to/project'],
      {
        cwd: 'path/to/project',
        env: { FOO: 'bar' },
        shell: true,
      }
    );
  });

  it('should run compodoc with tsconfig from compodocArgs', async () => {
    runCompodoc(
      {
        compodocArgs: ['-p', 'path/to/tsconfig.stories.json'],
        tsconfig: 'path/to/tsconfig.json',
      },
      {
        workspaceRoot: 'path/to/project',
        logger: builderContextLoggerMock,
      } as BuilderContext
    )
      .pipe(take(1))
      .subscribe();

    expect(cpSpawnMock.spawn).toHaveBeenCalledWith(
      'npx',
      ['compodoc', '-d', 'path/to/project', '-p', 'path/to/tsconfig.stories.json'],
      {
        cwd: 'path/to/project',
        env: { FOO: 'bar' },
        shell: true,
      }
    );
  });
});
