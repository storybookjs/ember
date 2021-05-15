import { addSerializer } from 'jest-specific-snapshot';
import globby from 'globby';
import path from 'path';

import { readCsf } from './CsfFile';

addSerializer({
  print: (val: any) => JSON.stringify(val, null, 2),
  test: (val) => typeof val !== 'string',
});

describe('csf extract', () => {
  const fixturesDir = path.join(__dirname, '__testfixtures__');
  const testFiles = globby
    .sync(path.join(fixturesDir, '*.stories.*'))
    .map((testFile) => [path.basename(testFile).split('.')[0], testFile]);

  it.each(testFiles)('%s', async (testName, testFile) => {
    const csf = (await readCsf(testFile)).parse();
    expect({ meta: csf.meta, stories: csf.stories }).toMatchSpecificSnapshot(
      path.join(fixturesDir, `${testName}.snapshot`)
    );
  });
});
