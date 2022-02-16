import fs from 'fs-extra';
import { compile } from '@storybook/csf-mdx1';

import { loadCsf, CsfOptions } from './CsfFile';

export const readCsfOrMdx = async (fileName: string, options: CsfOptions) => {
  let code = (await fs.readFile(fileName, 'utf-8')).toString();
  if (fileName.endsWith('.mdx')) {
    code = await compile(code);
  }
  return loadCsf(code, { ...options, fileName });
};

export * from './CsfFile';
export * from './ConfigFile';
export * from './getStorySortParameter';
