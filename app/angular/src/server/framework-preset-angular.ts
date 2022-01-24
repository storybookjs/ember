import path from 'path';
import semver from '@storybook/semver';
import { ContextReplacementPlugin, Configuration } from 'webpack';
import autoprefixer from 'autoprefixer';
import getTsLoaderOptions from './ts_config';
import createForkTsCheckerInstance from './create-fork-ts-checker-plugin';

export async function webpack(
  config: Configuration,
  { configDir, angularBuilderContext }: { configDir: string; angularBuilderContext: any }
): Promise<Configuration> {
  try {
    // Disable all this webpack stuff if we use angular-cli >= 12
    // Angular cli is in charge of doing all the necessary for angular. If there is any additional configuration to add, it must be done in the preset angular-cli versioned.
    const angularCliVersion = await import('@angular/cli').then((m) =>
      semver.coerce(m.VERSION.full)
    );
    if (
      (semver.satisfies(angularCliVersion, '12.2.x') && angularBuilderContext) ||
      semver.satisfies(angularCliVersion, '>=13.0.0')
    ) {
      return config;
    }
  } catch (error) {
    // do nothing, continue
  }

  const tsLoaderOptions = getTsLoaderOptions(configDir);
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: require.resolve('ts-loader'),
              options: tsLoaderOptions,
            },
            { loader: path.resolve(__dirname, 'ngx-template-loader') },
          ],
        },
        {
          test: /[/\\]@angular[/\\]core[/\\].+\.js$/,
          parser: { system: true },
        },
        {
          test: /\.html$/,
          loader: require.resolve('raw-loader'),
          exclude: /\.async\.html$/,
        },
        {
          test: /\.s(c|a)ss$/,
          use: [
            { loader: require.resolve('raw-loader') },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                postcssOptions: {
                  plugins: [autoprefixer()],
                },
              },
            },
            { loader: require.resolve('sass-loader') },
          ],
        },
      ],
    },
    resolve: {
      ...config.resolve,
    },
    plugins: [
      ...config.plugins,
      // See https://github.com/angular/angular/issues/11580#issuecomment-401127742
      new ContextReplacementPlugin(
        /@angular(\\|\/)core(\\|\/)(fesm5|bundles)/,
        path.resolve(__dirname, '..')
      ),
      createForkTsCheckerInstance(tsLoaderOptions) as any as Configuration['plugins'][0],
    ],
  };
}
