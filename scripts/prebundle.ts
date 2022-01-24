import path, { resolve } from 'path';
import execa from 'execa';
import { rollup, OutputOptions, RollupBuild, RollupOptions } from 'rollup';
import readPkgUp from 'read-pkg-up';
import fs from 'fs-extra';

import rollupTypescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel, getBabelOutputPlugin } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

import { generateDtsBundle } from 'dts-bundle-generator';
import * as dtsLozalize from './dts-localize';

async function build({
  input,
  externals,
  cwd,
}: {
  input: RollupOptions['input'];
  externals: RollupOptions['external'];
  cwd: string;
}) {
  const bundler = await rollup({
    input,
    external: externals,
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'external',
        skipPreflightCheck: true,
      }),
      json(),
      rollupTypescript({ lib: ['es2015', 'dom', 'esnext'], target: 'es6' }),
    ],
  });

  await generateOutputs({ cwd, bundler });

  await bundler.close();
}

async function generateOutputs({
  bundler,
  cwd,
  optimized = false,
}: {
  bundler: RollupBuild;
  cwd: string;
  optimized?: boolean;
}) {
  const outputs: OutputOptions[] = [
    {
      dir: resolve(cwd, './dist/modern'),
      format: 'es',
      plugins: [
        getBabelOutputPlugin({
          presets: [
            [
              '@babel/preset-env',
              {
                shippedProposals: true,
                useBuiltIns: 'usage',
                corejs: '3',
                modules: false,
                targets: { chrome: '94' },
              },
            ],
          ],
        }),
        optimized ? terser({ output: { comments: false }, module: true }) : null,
      ].filter(Boolean),
    },
    {
      dir: resolve(cwd, './dist/esm'),
      format: 'es',
      plugins: [
        getBabelOutputPlugin({
          presets: [
            [
              '@babel/preset-env',
              {
                shippedProposals: true,
                useBuiltIns: 'usage',
                modules: false,
                corejs: '3',
              },
            ],
          ],
        }),
        optimized ? terser({ output: { comments: false }, module: true }) : null,
      ].filter(Boolean),
    },
    {
      dir: resolve(cwd, './dist/cjs'),
      format: 'commonjs',
      plugins: [
        getBabelOutputPlugin({
          presets: [
            [
              '@babel/preset-env',
              {
                shippedProposals: true,
                useBuiltIns: 'usage',
                corejs: '3',
                modules: false,
                targets: { node: '14' },
              },
            ],
          ],
        }),
        optimized ? terser({ output: { comments: false }, module: true }) : null,
      ].filter(Boolean),
    },
  ];

  return Promise.all(outputs.map((config) => bundler.write(config)));
}

const dts = async ({
  input,
  externals,
  cwd,
}: {
  input: string;
  externals: string[];
  cwd: string;
}) => {
  const [out] = await generateDtsBundle([
    { filePath: input, output: { inlineDeclareGlobals: false, sortNodes: true, noBanner: true } },
  ]);

  const bundledDTSfile = path.join(cwd, 'dist/ts-tmp/index.d.ts');
  const localizedDTSout = path.join(cwd, 'dist/ts3.9');
  await fs.outputFile(bundledDTSfile, out);

  await dtsLozalize.run([bundledDTSfile], localizedDTSout, { externals, cwd });

  await fs.remove(path.join(cwd, 'dist/ts-tmp'));

  await execa('node', [
    path.join(__dirname, '../node_modules/.bin/downlevel-dts'),
    'dist/ts3.9',
    'dist/ts3.4',
  ]);
};

async function run() {
  const cwd = process.cwd();
  const { packageJson: pkg } = await readPkgUp({ cwd });
  const input = path.join(cwd, pkg.bundlerEntrypoint);
  const externals = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });

  const options = {
    cwd,
    externals,
    input,
  };

  await Promise.all([build(options), dts(options)]);
}

run().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
