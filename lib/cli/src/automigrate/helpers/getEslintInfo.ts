import fse from 'fs-extra';

export const SUPPORTED_ESLINT_EXTENSIONS = ['js', 'cjs'];
const UNSUPPORTED_ESLINT_EXTENSIONS = ['yaml', 'yml', 'json'];

export const findEslintFile = () => {
  const filePrefix = '.eslintrc';
  const unsupportedExtension = UNSUPPORTED_ESLINT_EXTENSIONS.find((ext: string) =>
    fse.existsSync(`${filePrefix}.${ext}`)
  );

  if (unsupportedExtension) {
    throw new Error(unsupportedExtension);
  }

  const extension = SUPPORTED_ESLINT_EXTENSIONS.find((ext: string) =>
    fse.existsSync(`${filePrefix}.${ext}`)
  );
  return extension ? `${filePrefix}.${extension}` : null;
};
