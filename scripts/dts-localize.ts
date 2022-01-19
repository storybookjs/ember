/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import path from 'path';
import fs from 'fs-extra';
import { sync } from 'read-pkg-up';

import * as ts from 'typescript';

const parseConfigHost = {
  useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  readDirectory: ts.sys.readDirectory,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
};

function getAbsolutePath(fileName: string, cwd?: string) {
  if (!path.isAbsolute(fileName)) {
    fileName = path.join(cwd !== undefined ? cwd : process.cwd(), fileName);
  }

  return fileName;
}

function getCompilerOptions(inputFileNames: string[], preferredConfigPath?: string) {
  const configFileName =
    preferredConfigPath !== undefined ? preferredConfigPath : findConfig(inputFileNames);
  const configParseResult = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptionsParseResult = ts.parseJsonConfigFileContent(
    configParseResult.config,
    parseConfigHost,
    path.resolve(path.dirname(configFileName)),
    undefined,
    getAbsolutePath(configFileName)
  );

  return compilerOptionsParseResult.options;
}

function findConfig(inputFiles: string[]) {
  if (inputFiles.length !== 1) {
    throw new Error(
      'Cannot find tsconfig for multiple files. Please specify preferred tsconfig file'
    );
  }

  // input file could be a relative path to the current path
  // and desired config could be outside of current cwd folder
  // so we have to provide absolute path to find config until the root
  const searchPath = getAbsolutePath(inputFiles[0]);
  const configFileName = ts.findConfigFile(searchPath, ts.sys.fileExists);
  if (!configFileName) {
    throw new Error(`Cannot find config file for file ${searchPath}`);
  }

  return configFileName;
}

interface Options {
  externals: string[];
  cwd?: string;
}

export const run = async (entrySourceFiles: string[], outputPath: string, options: Options) => {
  const compilerOptions = getCompilerOptions(entrySourceFiles);
  const host = ts.createCompilerHost(compilerOptions);
  const cwd = options.cwd || process.cwd();
  const pkg = sync({ cwd }).packageJson;
  const externals = [].concat(pkg.unbundledDependencies).concat(options.externals);

  // this to make paths for local packages as they are in node_modules because of yarn
  // but it depends on the way you handle "flatting of files"
  // so basically you can remove this host completely if you handle it in different way
  host.realpath = (p: string) => p;

  const program = ts.createProgram(entrySourceFiles, compilerOptions, host);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });

  const typeChecker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles();

  const filesRemapping = new Map<string, string>();
  const replaceRemapping = new Map<string, string[]>();

  for (const sourceFile of sourceFiles) {
    // skip lib files from the compiler
    if (program.isSourceFileDefaultLibrary(sourceFile)) {
      continue;
    }

    // here you can implement any logic regarding how your new files should be placed
    // as for this POC I used rough solution to use the same structure but I believe it should be improved
    filesRemapping.set(sourceFile.fileName, getNewPath(cwd, sourceFile.fileName));
  }

  entrySourceFiles.forEach((file) => {
    const sourceFile = sourceFiles.find((f) => f.fileName === file);

    actOnSourceFile(sourceFile);
  });

  function getNewPath(basePath: string, filePath: string) {
    const relative = path.relative(basePath, filePath);
    let newPath = '';

    if (relative.includes('node_modules/')) {
      const [, ...parts] = relative.split('node_modules/');
      const filename = parts.join('node_modules/').split('/').join('-');
      newPath = path.join(outputPath, '_modules', filename);
    } else if (relative.includes('dist/ts-tmp/')) {
      const [, ...parts] = relative.split('dist/ts-tmp/');
      const filename = parts.join('').split('/').join('-');
      newPath = path.join(outputPath, filename);
    } else {
      const filename = relative.split('/').join('-');
      newPath = path.join(outputPath, filename);
    }
    return newPath;
  }

  function wasReplaceAlready(fileName: string, target: string) {
    if (replaceRemapping.has(fileName) && replaceRemapping.get(fileName).includes(target)) {
      console.log('skipped', target);
      return true;
    }
    return false;
  }

  function getReplacementPath(
    currentSourceFile: string,
    referencedSourceFile: string,
    target: string
  ) {
    const targetRelativeToSource2 = path
      .relative(filesRemapping.get(currentSourceFile), filesRemapping.get(referencedSourceFile))
      .slice(1)
      .replace('.d.ts', '')
      .replace('.ts', '');

    replaceRemapping.set(currentSourceFile, [
      ...(replaceRemapping.get(currentSourceFile) || []),
      targetRelativeToSource2,
    ]);

    console.log('renamed', target);
    return targetRelativeToSource2;
  }

  function wasIgnored(target: string) {
    if (externals.includes(target)) {
      console.log('ignored', target);

      return true;
    }
    return false;
  }

  function replaceImport(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined
    ) {
      // @ts-ignore
      const target: string = node.moduleSpecifier.text;
      let currentSourceFile = '';
      let referencedSourceFile = '';

      if (wasIgnored(target)) {
        return true;
      }

      currentSourceFile = node.getSourceFile().fileName;

      if (wasReplaceAlready(currentSourceFile, target)) {
        return true;
      }

      // find the sourceFile the import is pointing to
      referencedSourceFile = getSourceFile(
        typeChecker.getSymbolAtLocation(node.moduleSpecifier).valueDeclaration
      ).fileName;

      const replacementPath = getReplacementPath(currentSourceFile, referencedSourceFile, target);
      // @ts-ignore
      node.moduleSpecifier = ts.factory.createStringLiteral(replacementPath);

      return true;
    }

    if (ts.isImportTypeNode(node)) {
      const target = node.argument.getText().slice(1, -1);
      let currentSourceFile = '';
      let referencedSourceFile = '';

      if (wasIgnored(target)) {
        return true;
      }

      currentSourceFile = node.getSourceFile().fileName;

      if (wasReplaceAlready(currentSourceFile, target)) {
        return true;
      }

      // find the sourceFile the import is pointing to
      referencedSourceFile = getSourceFile(
        typeChecker.getSymbolAtLocation(node).valueDeclaration
      ).fileName;

      const replacementPath = getReplacementPath(currentSourceFile, referencedSourceFile, target);

      // @ts-ignore
      node.argument = ts.factory.createStringLiteral(replacementPath);

      return true;
    }

    return undefined;
  }

  function getSourceFile(moduleNode: ts.Node) {
    while (!ts.isSourceFile(moduleNode)) {
      moduleNode = moduleNode.parent;
    }
    return moduleNode;
  }

  function remapImports(node: ts.Node) {
    // it seems that it is unnecessary, but we're sure that it is impossible to have import statement later than we can just skip this node
    if (replaceImport(node)) {
      return;
    }

    ts.forEachChild(node, (n) => remapImports(n));
  }

  function output(sourceFile: ts.SourceFile) {
    const newPath = filesRemapping.get(sourceFile.fileName);
    fs.outputFileSync(newPath, printer.printFile(sourceFile).trim());
  }

  function actOnSourceFile(sourceFile: ts.SourceFile & { resolvedModules?: Map<any, any> }) {
    remapImports(sourceFile);

    output(sourceFile);

    // using a internal 'resolvedModules' API to get all the modules that were imported by this source file
    // this seems to be a cache TypeScript uses internally
    // I've been looking for a a public API to use, but so far haven't found it.
    // I could create the dependency graph myself, perhaps that'd be better, but I'm OK with this for now.
    if (sourceFile.resolvedModules && sourceFile.resolvedModules.size > 0) {
      Array.from(sourceFile.resolvedModules.entries()).forEach(([k, v]) => {
        if (externals.includes(k)) {
          return;
        }
        actOnSourceFile(sourceFiles.find((f) => f.fileName === v.resolvedFileName));
      });
    }
  }
};

// run(
//   [getAbsolutePath('./dist/ts-tmp/index.d.ts')],
//   path.join(__dirname, '..', 'dist', 'ts3.9'),

//   {
//     externals: [
//       '@storybook/addons',
//       '@storybook/csf',
//       '@storybook/theming',
//       'core-js',
//       'react-dom',
//       'prop-types',
//       'react',
//     ],
//   }
// ).catch((e) => {
//   console.error(e);

//   process.exit(1);
// });
