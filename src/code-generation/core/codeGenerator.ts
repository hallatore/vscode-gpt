import * as vscode from "vscode";
import CodeGenerationBase from "./CodeGenerationBase";
import { CodeResult } from "./CodeResult";
import PythonCodeGeneration from "../python/PythonCodeGeneration";
import TypescriptCodeGeneration from "../typescript/TypescriptCodeGeneration";

export const generateCode = async (
  extraInstructions: string,
  selection: vscode.Range,
  editor: vscode.TextEditor,
  streamCallback: (result: CodeResult | null) => void,
  cancellationToken: vscode.CancellationToken
): Promise<CodeResult | null> => {
  let codeGeneration: CodeGenerationBase;

  switch (editor.document.languageId) {
    case "typescript":
    case "typescriptreact":
      codeGeneration = new TypescriptCodeGeneration(
        extraInstructions,
        selection,
        editor
      );
      break;
    case "python":
      codeGeneration = new PythonCodeGeneration(
        extraInstructions,
        selection,
        editor
      );
      break;
    default:
      codeGeneration = new CodeGenerationBase(
        extraInstructions,
        selection,
        editor
      );
  }

  return await codeGeneration.generateCode(streamCallback, cancellationToken);
};
