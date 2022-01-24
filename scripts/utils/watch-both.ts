import { readJSON } from 'fs-extra';
import path from 'path';
// @ts-ignore
import { tscfy } from './compile-tsc';
// @ts-ignore
import { babelify } from './compile-babel';

async function run() {
  const packageJson = await readJSON(path.join(process.cwd(), 'package.json'));

  if (packageJson.bundlerEntrypoint) {
    console.log('bundling...');
    (await import('../bundle-package')).run({
      cwd: process.cwd(),
      flags: ['--watch'],
    });
  } else {
    tscfy({
      watch: true,
      silent: false,
      // eslint-disable-next-line no-console
      errorCallback: () => console.error('Failed to compile ts'),
    });
    babelify({
      modules: true,
      silent: false,
      watch: true,
      // eslint-disable-next-line no-console
      errorCallback: () => console.error('Failed to compile js'),
    });
  }
}

run().catch((e) => {
  console.log(e);
  process.exit(1);
});
