import global from 'global';
import fs from 'fs-extra';

import { loadCsf } from './dist/esm/index';

export const readCsfOrMdx = async (fileName, options) => {
  let code = (await fs.readFile(fileName, 'utf-8')).toString();
  if (fileName.endsWith('.mdx')) {
    const { compile } = global.FEATURES?.previewMdx2
      ? await import('@storybook/mdx2-csf')
      : await import('@storybook/mdx1-csf');
    code = await compile(code);
  }
  return loadCsf(code, { ...options, fileName });
};

export * from './dist/esm/index';
