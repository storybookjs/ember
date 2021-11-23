import { BuilderContext } from '@angular-devkit/architect';
import { spawn } from 'child_process';
import { Observable } from 'rxjs';

const hasTsConfigArg = (args: string[]) => args.indexOf('-p') !== -1;

export const runCompodoc = (
  { compodocArgs, tsconfig }: { compodocArgs: string[]; tsconfig: string },
  context: BuilderContext
): Observable<void> => {
  return new Observable<void>((observer) => {
    const finalCompodocArgs = [
      'compodoc',
      // Default options
      ...(hasTsConfigArg(compodocArgs) ? [] : ['-p', tsconfig]),
      '-d',
      `${context.workspaceRoot}`,
      ...compodocArgs,
    ];

    try {
      context.logger.info(finalCompodocArgs.join(' '));
      const child = spawn('npx', finalCompodocArgs, {
        cwd: context.workspaceRoot,
        env: process.env,
        shell: true,
      });

      child.stdout.on('data', (data) => {
        context.logger.info(data.toString());
      });
      child.stderr.on('data', (data) => {
        context.logger.error(data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          observer.next();
          observer.complete();
        } else {
          observer.error();
        }
      });
    } catch (error) {
      observer.error(error);
    }
  });
};
