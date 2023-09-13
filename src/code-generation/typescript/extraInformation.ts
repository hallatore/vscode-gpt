import * as vscode from "vscode";
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

type Declaration = {
  name: string;
  value: string;
};

export const getExtraInformation = (
  document: vscode.TextDocument
): Declaration[] => {
  const configFileName = ts.findConfigFile(
    document.fileName,
    ts.sys.fileExists
  )!;

  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configFileName)
  );

  const options = compilerOptions.options;

  const host = ts.createCompilerHost(options, true);
  const program = ts.createProgram([document.fileName], options, host);
  const checker = program.getTypeChecker();

  const languageService = ts.createLanguageService(
    {
      getScriptFileNames: () => [document.fileName],
      getScriptVersion: () => "0",
      getScriptSnapshot: (fileName: string) => {
        let text = "";
        if (path.resolve(fileName) === path.resolve(document.fileName)) {
          text = document.getText();
        } else if (fs.existsSync(fileName)) {
          text = fs.readFileSync(fileName).toString();
        } else {
          return undefined;
        }

        return {
          getText: (start, end) => text.substring(start, end),
          getLength: () => text.length,
          getChangeRange: () => undefined,
        };
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      readFile: (
        filePath: string,
        _encoding?: string | undefined
      ): string | undefined => {
        if (path.resolve(filePath) === path.resolve(document.fileName)) {
          return document.getText();
        } else {
          return fs.readFileSync(path.resolve(filePath)).toString();
        }
      },
      fileExists: (filePath: string): boolean => {
        if (path.resolve(filePath) === path.resolve(document.fileName)) {
          return true;
        } else {
          return fs.existsSync(path.resolve(filePath));
        }
      },
      directoryExists: (filePath: string): boolean => {
        return fs.existsSync(path.resolve(filePath));
      },
    },
    ts.createDocumentRegistry()
  );

  const sourceFile = languageService
    .getProgram()
    ?.getSourceFile(document.fileName);

  if (!sourceFile) {
    vscode.window.showErrorMessage("File not found");
    return [];
  }

  const imports: Declaration[] = [];

  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      if (node.importClause?.name) {
        const defaultImportSymbol = checker.getSymbolAtLocation(
          node.importClause.name
        );

        const name = node.importClause.name.escapedText.toString();

        let importSymbol = languageService.getQuickInfoAtPosition(
          path.resolve(
            defaultImportSymbol!.declarations![0]!.getSourceFile().fileName
          ),
          defaultImportSymbol!.declarations![0]!.getStart()
        );

        if (importSymbol) {
          const x = importSymbol
            .displayParts!.map((part) => part.text)
            .join("");
          imports.push({
            name: name,
            value: cleanDeclaration(x),
          });
        }
      }

      const namedBindings = node.importClause?.namedBindings;

      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          const name = element.name.escapedText.toString();
          const symbol = checker.getSymbolAtLocation(element.name);
          const aliasedSymbol = checker.getAliasedSymbol(symbol!);

          const value = getNodeDescription(
            aliasedSymbol,
            element,
            languageService,
            sourceFile
          );

          if (value) {
            imports.push({
              name,
              value,
            });
          }
        }
      }
    }
  });

  return imports;
};

const getNodeDescription = (
  aliasedSymbol: ts.Symbol,
  element: ts.ImportSpecifier,
  languageService: ts.LanguageService,
  sourceFile: ts.SourceFile
): string | undefined => {
  let importSymbol;

  if (aliasedSymbol.declarations) {
    const temp = aliasedSymbol.declarations![0];

    importSymbol = languageService.getQuickInfoAtPosition(
      path.resolve(temp.getSourceFile().fileName),
      temp.getStart()
    );

    if (ts.isTypeAliasDeclaration(temp) || ts.isInterfaceDeclaration(temp)) {
      const code = temp
        .getSourceFile()
        .getText()
        .substring(temp.pos, temp.end)
        .trim();
      return cleanDeclaration(code);
    }
  }

  if (!importSymbol) {
    importSymbol = languageService.getQuickInfoAtPosition(
      path.resolve(sourceFile.fileName),
      element.getStart()
    );
  }

  if (importSymbol && importSymbol.displayParts) {
    const x = importSymbol.displayParts.map((part) => part.text).join("");
    return cleanDeclaration(x);
  }
};

const cleanDeclaration = (declaration: string): string => {
  // const getDate: (item1: number) => Promise<string>
  // export interface MyInterface { name: string; age: number; }
  // export type MyType = { name: string; age: number; };
  // (alias) function getMyType(item2: number): MyType import getMyType

  if (declaration.startsWith("(alias) ")) {
    declaration = declaration.substring("(alias) ".length).trim();
  }

  if (declaration.startsWith("export ")) {
    declaration = declaration.substring("export ".length).trim();
  }

  if (/\nimport [\w]+$/.test(declaration)) {
    declaration = declaration
      .substring(0, declaration.lastIndexOf("\nimport"))
      .trim();
  }

  return declaration.replaceAll(/[\r\n]+/g, " ").replaceAll(/\s{2,}/g, " ");
};
