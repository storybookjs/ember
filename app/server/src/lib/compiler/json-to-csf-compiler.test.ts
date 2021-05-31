import 'jest-specific-snapshot';
import path from 'path';
import fs from 'fs-extra';
import YAML from 'yaml';
import { compileCsfModule } from '.';

const inputRegExp = /\.(json|ya?ml)$/;

async function generate(filePath: string) {
  const content = await fs.readFile(filePath, 'utf8');
  const parsed = filePath.endsWith('.json') ? JSON.parse(content) : YAML.parse(content);
  return compileCsfModule(parsed);
}

describe('json-to-csf-compiler', () => {
  const transformFixturesDir = path.join(__dirname, '__testfixtures__');
  fs.readdirSync(transformFixturesDir)
    .filter((fileName: string) => inputRegExp.test(fileName))
    .forEach((fixtureFile: string) => {
      // eslint-disable-next-line jest/valid-title
      it(fixtureFile, async () => {
        const inputPath = path.join(transformFixturesDir, fixtureFile);
        const code = await generate(inputPath);
        expect(code).toMatchSpecificSnapshot(inputPath.replace(inputRegExp, '.snapshot'));
      });
    });
});
