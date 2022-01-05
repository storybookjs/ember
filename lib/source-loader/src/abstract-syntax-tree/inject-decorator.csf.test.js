import fs from 'fs';
import path from 'path';
import 'jest-specific-snapshot';
import injectDecorator from './inject-decorator';

const { SNAPSHOT_OS } = global;

describe('inject-decorator', () => {
  const snapshotDir = path.join(__dirname, '__snapshots__');

  describe('positive - ts - csf', () => {
    it('includes storySource parameter in the default exported object', () => {
      const mockFilePath = './__mocks__/inject-decorator.ts.csf.txt';
      const source = fs.readFileSync(mockFilePath, 'utf-8');
      const result = injectDecorator(source, path.resolve(__dirname, mockFilePath), {
        parser: 'typescript',
      });

      expect(result.source).toMatchSpecificSnapshot(
        path.join(snapshotDir, `inject-decorator.csf.test.js.${SNAPSHOT_OS}.snapshot`)
      );
      expect(result.source).toEqual(
        expect.stringContaining(
          'export default {parameters: {"storySource":{"source":"import React from'
        )
      );
    });
  });

  describe('injectStoryParameters - ts - csf', () => {
    it('includes storySource parameter in the default exported object', () => {
      const mockFilePath = './__mocks__/inject-parameters.ts.csf.txt';
      const source = fs.readFileSync(mockFilePath, 'utf-8');
      const result = injectDecorator(source, path.resolve(__dirname, mockFilePath), {
        injectStoryParameters: true,
        parser: 'typescript',
      });
      expect(result.source).toMatchSpecificSnapshot(
        path.join(
          snapshotDir,
          `inject-decorator.csf.test.js.injectStoryParameters-${SNAPSHOT_OS}.snapshot`
        )
      );
    });
  });
});
