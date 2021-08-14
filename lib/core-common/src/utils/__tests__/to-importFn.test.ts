import { createContext, runInContext } from 'vm';

import { toImportFn } from '../to-importFn';
import { testCases } from './require-test-cases';

describe('toImportFn', () => {
  testCases.forEach(({ glob, validPaths, invalidPaths }) => {
    it(`matches only suitable paths - ${glob}`, () => {
      const importFnString = toImportFn([{ glob }]);

      const code = `
        ${importFnString.replace('export', '').replace('import(', 'importMock(')};
        importFn(testCase)  ;
      `;

      validPaths.forEach((testCase) => {
        const importMock = jest.fn();

        eval(code);

        // const pathWithoutLeadingSlash = path.substring(2);
        // const context = createContext({ import: importMock, testCase: pathWithoutLeadingSlash });
        // runInContext(code, context);
        expect(importMock).toHaveBeenCalledWith(testCase);
      });
    });
  });
});
