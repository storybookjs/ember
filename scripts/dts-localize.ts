/* eslint-disable no-param-reassign */
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
  const externals = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });

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

  entrySourceFiles.forEach((file) => {
    const sourceFile = sourceFiles.find((f) => f.fileName === file);

    actOnSourceFile(sourceFile);
  });

  /**
   * @param  {string} basePath the path is the directory where the package.json is located
   * @param  {string} filePath the path of the current file
   */
  function getReplacementPathRelativeToBase(basePath: string, filePath: string) {
    const relative = path.relative(basePath, filePath);
    let newPath = '';

    /*
      first we work out the relative path from the basePath
      we might get a path like: ../../node_modules/packagename/dist/dir/file.ts
      Here's a few examples of what the idea is:

      ../../node_modules/packagename/dist/dir/file.ts => _modules/packagename-dist-dir-file.ts
      ../../node_modules/packagename/node_modules/b/dist/dir/file.ts => _modules/packagename-node_modules-b-dist-dir-file.ts
      ./node_modules/packagename/dist/dir/file.ts => _modules/packagename-dist-dir-file.ts
      ./dist/ts-tmp/file.ts => file.ts
      
    */

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

  function wasReplacedAlready(fileName: string, target: string) {
    // skipping this import because is has been previously replaced already
    if (replaceRemapping.has(fileName) && replaceRemapping.get(fileName).includes(target)) {
      return true;
    }
    return false;
  }

  function getReplacementPathRelativeToFile(
    currentSourceFile: string,
    referencedSourceFile: string
  ) {
    filesRemapping.set(currentSourceFile, getReplacementPathRelativeToBase(cwd, currentSourceFile));
    filesRemapping.set(
      referencedSourceFile,
      getReplacementPathRelativeToBase(cwd, referencedSourceFile)
    );

    const result = path
      .relative(filesRemapping.get(currentSourceFile), filesRemapping.get(referencedSourceFile))
      .slice(1)
      .replace('.d.ts', '')
      .replace('.ts', '');

    replaceRemapping.set(currentSourceFile, [
      ...(replaceRemapping.get(currentSourceFile) || []),
      result,
    ]);

    return result;
  }

  function wasIgnored(target: string) {
    if (externals.includes(target)) {
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

      if (wasReplacedAlready(currentSourceFile, target)) {
        return true;
      }

      // find the sourceFile the import is pointing to
      referencedSourceFile = getSourceFile(
        typeChecker.getSymbolAtLocation(node.moduleSpecifier).valueDeclaration
      ).fileName;

      const replacementPath = getReplacementPathRelativeToFile(
        currentSourceFile,
        referencedSourceFile
      );

      // @ts-ignore
      node.moduleSpecifier = ts.createStringLiteral(replacementPath);

      return true;
    }

    if (ts.isImportTypeNode(node)) {
      const target = node.argument.getText().slice(1, -1);
      let currentSourceFile = '';
      let referencedSourceFile = '';

      // check if the import's path is in the ignore-list
      if (wasIgnored(target)) {
        return true;
      }

      currentSourceFile = node.getSourceFile().fileName;

      // check if it's already been replaced previously
      if (wasReplacedAlready(currentSourceFile, target)) {
        return true;
      }

      // find the sourceFile the import is pointing to
      referencedSourceFile = getSourceFile(
        typeChecker.getSymbolAtLocation(node).valueDeclaration
      ).fileName;

      const replacementPath = getReplacementPathRelativeToFile(
        currentSourceFile,
        referencedSourceFile
      );

      // @ts-ignore
      node.argument = ts.createStringLiteral(replacementPath);
      // node.argument = ts.factory.createStringLiteral(replacementPath); // TS4

      return true;
    }

    return undefined;
  }

  function getSourceFile(moduleNode: ts.Node) {
    while (!ts.isSourceFile(moduleNode)) {
      moduleNode = moduleNode.getSourceFile();
    }
    return moduleNode;
  }

  function walkNodeToReplaceImports(node: ts.Node) {
    // it seems that it is unnecessary, but we're sure that it is impossible to have import statement later than we can just skip this node
    if (replaceImport(node)) {
      return;
    }

    ts.forEachChild(node, (n) => walkNodeToReplaceImports(n));
  }

  function outputSourceToFile(sourceFile: ts.SourceFile) {
    const newPath = filesRemapping.get(sourceFile.fileName);
    fs.outputFileSync(newPath, printer.printFile(sourceFile).trim());
  }

  function actOnSourceFile(sourceFile: ts.SourceFile & { resolvedModules?: Map<any, any> }) {
    // console.log(sourceFile);
    filesRemapping.set(
      sourceFile.fileName,
      getReplacementPathRelativeToBase(cwd, sourceFile.fileName)
    );

    walkNodeToReplaceImports(sourceFile);

    outputSourceToFile(sourceFile);

    // using a internal 'resolvedModules' API to get all the modules that were imported by this source file
    // this seems to be a cache TypeScript uses internally
    // I've been looking for a a public API to use, but so far haven't found it.
    // I could create the dependency graph myself, perhaps that'd be better, but I'm OK with this for now.
    if (sourceFile.resolvedModules && sourceFile.resolvedModules.size > 0) {
      Array.from(sourceFile.resolvedModules.entries()).forEach(([k, v]) => {
        // console.log({ k }, v.resolvedFileName);
        if (externals.includes(k)) {
          return;
        }
        const x = sourceFiles.find((f) => f.fileName === v.resolvedFileName);
        if (!x) {
          return;
        }
        if (replaceRemapping.has(v.resolvedFileName)) {
          return;
        }

        actOnSourceFile(sourceFiles.find((f) => f.fileName === v.resolvedFileName));
      });
    }
  }
};
