import path, { resolve } from 'path';
import { rollup, OutputOptions } from 'rollup';
import { sync } from 'read-pkg-up';
import fs from 'fs-extra';

import rollupTypescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

import { generateDtsBundle } from 'dts-bundle-generator';
import * as dtsLozalize from './dts-localize';

interface BuildOptions {
  cwd: string;
  input: string;
  externals: string[];
}

async function buildESM({ cwd, input, externals }: BuildOptions) {
  const bundle = await rollup({
    input,
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      babel({ babelHelpers: 'runtime', skipPreflightCheck: true }),
      rollupTypescript({ lib: ['es2015', 'dom'], target: 'es6' }),
      terser({ output: { comments: false }, module: true }),
    ],
    external: externals,
  });

  const previewOutputOptions: OutputOptions = {
    dir: resolve(cwd, './dist/esm'),
    format: 'es',
  };

  await bundle.generate(previewOutputOptions);
  await bundle.write(previewOutputOptions);
  await bundle.close();
}

async function buildModern({ cwd, input, externals }: BuildOptions) {
  const bundle = await rollup({
    input,
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      babel({
        babelHelpers: 'runtime',
        skipPreflightCheck: true,
        presets: [
          [
            '@babel/preset-env',
            {
              shippedProposals: true,
              useBuiltIns: 'usage',
              corejs: '3',
              targets: { chrome: '79' },
            },
          ],
        ],
      }),
      rollupTypescript({ lib: ['es2015', 'dom'], target: 'es6' }),
      terser({ output: { comments: false }, module: true }),
    ],
    external: externals,
  });

  const previewOutputOptions: OutputOptions = {
    dir: resolve(cwd, './dist/modern'),
    format: 'es',
  };

  await bundle.generate(previewOutputOptions);
  await bundle.write(previewOutputOptions);
  await bundle.close();
}

async function buildCJS({ cwd, input, externals }: BuildOptions) {
  const bundle = await rollup({
    input,
    plugins: [
      nodeResolve({
        browser: false,
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      babel({ babelHelpers: 'runtime', skipPreflightCheck: true }),
      rollupTypescript({ lib: ['es2015', 'dom'], target: 'es6' }),
      terser({ output: { comments: false } }),
    ],
    external: externals,
  });

  const previewOutputOptions: OutputOptions = {
    dir: resolve(cwd, './dist/cjs'),
    format: 'commonjs',
  };

  await bundle.generate(previewOutputOptions);
  await bundle.write(previewOutputOptions);
  await bundle.close();
}

async function run() {
  const cwd = process.cwd();
  const pkg = sync({ cwd }).packageJson;
  const input = path.join(cwd, pkg.bundlerEntrypoint);
  const externals = [].concat(pkg.unbundledDependencies);

  const options = {
    cwd,
    externals,
    input,
  };

  await buildESM(options);
  await buildCJS(options);
  await buildModern(options);

  const [out] = await generateDtsBundle([
    { filePath: input, output: { inlineDeclareGlobals: true, sortNodes: true, noBanner: true } },
  ]);

  const bundledDTSfile = path.join(cwd, 'dist/ts-tmp/index.d.ts');
  const bundledDTSout = path.join(cwd, 'dist/ts3.9');
  await fs.outputFile(bundledDTSfile, out);

  await dtsLozalize.run([bundledDTSfile], bundledDTSout, { externals, cwd });
}

run().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
