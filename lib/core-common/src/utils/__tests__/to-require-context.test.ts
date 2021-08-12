import path from 'path';
import { toRequireContext } from '../to-require-context';

import { testCases } from './require-test-cases';

describe('toRequireContext', () => {
  testCases.forEach(({ glob, recursive, validPaths, invalidPaths }) => {
    it(`matches only suitable paths - ${glob}`, () => {
      const { path: base, recursive: willRecurse, match } = toRequireContext(glob);

      const regex = new RegExp(match);

      function isMatched(filePath: string) {
        const relativePath = `./${path.relative(base, filePath)}`;

        const baseIncluded = filePath.includes(base);
        const matched = regex.test(relativePath);

        return baseIncluded && matched;
      }

      const isNotMatchedForValidPaths = validPaths.filter((filePath) => !isMatched(filePath));
      const isMatchedForInvalidPaths = invalidPaths.filter((filePath) => !!isMatched(filePath));

      expect(isNotMatchedForValidPaths).toEqual([]);
      expect(isMatchedForInvalidPaths).toEqual([]);
      expect(willRecurse).toEqual(recursive);
    });
  });
});
