import { isExportStory, sanitize, Parameters, AnyFramework, ComponentTitle } from '@storybook/csf';
import { logger } from '@storybook/client-logger';

import { ModuleExports, CSFFile, NormalizedComponentAnnotations } from './types';
import { normalizeStory } from './normalizeStory';
import { normalizeInputTypes } from './normalizeInputTypes';
import { Path } from '.';

const checkGlobals = (parameters: Parameters) => {
  const { globals, globalTypes } = parameters;
  if (globals || globalTypes) {
    logger.error(
      'Global args/argTypes can only be set globally',
      JSON.stringify({
        globals,
        globalTypes,
      })
    );
  }
};

const checkStorySort = (parameters: Parameters) => {
  const { options } = parameters;
  if (options?.storySort) logger.error('The storySort option parameter can only be set globally');
};

const checkDisallowedParameters = (parameters: Parameters) => {
  if (!parameters) {
    return;
  }
  checkGlobals(parameters);
  checkStorySort(parameters);
};

// Given the raw exports of a CSF file, check and normalize it.
export function processCSFFile<TFramework extends AnyFramework>(
  moduleExports: ModuleExports,
  importPath: Path,
  title: ComponentTitle
): CSFFile<TFramework> {
  const { default: defaultExport, __namedExportsOrder, ...namedExports } = moduleExports;

  const { id, argTypes } = defaultExport;
  const meta: NormalizedComponentAnnotations<TFramework> = {
    id: sanitize(id || title),
    ...defaultExport,
    title,
    ...(argTypes && { argTypes: normalizeInputTypes(argTypes) }),
    parameters: {
      fileName: importPath,
      ...defaultExport.parameters,
    },
  };
  checkDisallowedParameters(meta.parameters);

  const csfFile: CSFFile<TFramework> = { meta, stories: {} };

  Object.keys(namedExports).forEach((key) => {
    if (isExportStory(key, meta)) {
      const storyMeta = normalizeStory(key, namedExports[key], meta);
      checkDisallowedParameters(storyMeta.parameters);

      csfFile.stories[storyMeta.id] = storyMeta;
    }
  });

  return csfFile;
}
