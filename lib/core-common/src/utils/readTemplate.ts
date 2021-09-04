import path from 'path';
import fse from 'fs-extra';

export async function readTemplate(filename: string) {
  return fse.readFile(path.join(__dirname, filename), {
    encoding: 'utf8',
  });
}
