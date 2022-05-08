const { buildStaticStandalone } = require('../lib/core-server/dist/cjs/build-static');

process.env.NODE_ENV = 'production';

const logger = console;

const run = async () => {
  logger.log('Building Webpack4 Manager');
  await buildStaticStandalone({
    ignorePreview: true,
    outputDir: './lib/manager-webpack4/prebuilt',
    configDir: './scripts/build-manager-config',
  });

  logger.log('Building Webpack5 Manager');
  await buildStaticStandalone({
    ignorePreview: true,
    outputDir: './lib/manager-webpack5/prebuilt',
    configDir: './scripts/build-manager-config',
  });
};

run().catch((err) => {
  logger.log(err);
  process.exit(1);
});
