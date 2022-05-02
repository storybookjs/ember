import {
  getPreviewBodyTemplate,
  getPreviewHeadTemplate,
  getManagerMainTemplate,
  getPreviewMainTemplate,
  loadCustomBabelConfig,
  getStorybookBabelConfig,
  loadEnvs,
  CoreConfig,
  StorybookConfig,
} from '@storybook/core-common';
import type { Options } from '@storybook/core-common';

export const babel = async (_: unknown, options: Options) => {
  const { configDir, presets } = options;
  if (options.features?.babelModeV7) {
    return presets.apply('babelDefault', {}, options);
  }

  return loadCustomBabelConfig(
    configDir,
    () => presets.apply('babelDefault', getStorybookBabelConfig(), options) as any
  );
};

export const logLevel = (previous: any, options: Options) => previous || options.loglevel || 'info';

export const previewHead = async (base: any, { configDir, presets }: Options) => {
  const interpolations = await presets.apply<Record<string, string>>('env');
  return getPreviewHeadTemplate(configDir, interpolations);
};

export const env = async () => {
  return loadEnvs({ production: true }).raw;
};

export const previewBody = async (base: any, { configDir, presets }: Options) => {
  const interpolations = await presets.apply<Record<string, string>>('env');
  return getPreviewBodyTemplate(configDir, interpolations);
};

export const previewMainTemplate = () => getPreviewMainTemplate();

export const managerMainTemplate = () => getManagerMainTemplate();

export const previewEntries = (entries: any[] = [], options: { modern?: boolean }) => {
  if (!options.modern)
    entries.push(require.resolve('@storybook/core-client/dist/esm/globals/polyfills'));
  entries.push(require.resolve('@storybook/core-client/dist/esm/globals/globals'));
  return entries;
};

export const typescript = () => ({
  check: false,
  // 'react-docgen' faster but produces lower quality typescript results
  reactDocgen: 'react-docgen-typescript',
  reactDocgenTypescriptOptions: {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop: any) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    // NOTE: this default cannot be changed
    savePropValueAsString: true,
  },
});

const optionalEnvToBoolean = (input: string | undefined): boolean | undefined => {
  if (input === undefined) {
    return undefined;
  }
  if (input.toUpperCase() === 'FALSE') {
    return false;
  }
  if (input.toUpperCase() === 'TRUE') {
    return true;
  }
  if (typeof input === 'string') {
    return true;
  }
  return undefined;
};

/**
 * If for some reason this config is not applied, the reason is that
 * likely there is an addon that does `export core = () => ({ someConfig })`,
 * instead of `export core = (existing) => ({ ...existing, someConfig })`,
 * just overwriting everything and not merging with the existing values.
 */
export const core = async (existing: CoreConfig, options: Options): Promise<CoreConfig> => ({
  ...existing,
  disableTelemetry: options.disableTelemetry === true,
  enableCrashReports:
    options.enableCrashReports || optionalEnvToBoolean(process.env.STORYBOOK_ENABLE_CRASH_REPORTS),
});

export const config = async (base: any, options: Options) => {
  return [...(await options.presets.apply('previewAnnotations', [], options)), ...base];
};

export const features = async (
  existing: StorybookConfig['features']
): Promise<StorybookConfig['features']> => ({
  ...existing,
  postcss: true,
  emotionAlias: false, // TODO remove in 7.0, this no longer does anything
  warnOnLegacyHierarchySeparator: true,
  buildStoriesJson: false,
  storyStoreV7: false,
  modernInlineRender: false,
  breakingChangesV7: false,
  interactionsDebugger: false,
  babelModeV7: false,
  argTypeTargetsV7: false,
  previewMdx2: false,
});
