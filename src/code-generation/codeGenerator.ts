import * as vscode from "vscode";
import { CodeGenerationBase, CodeResult } from "./CodeGenerationBase";
import { PythonCodeGeneration } from "./python/PythonCodeGeneration";
import { TypescriptCodeGeneration } from "./typescript/TypescriptCodeGeneration";
import { GeneralCodeGeneration } from "./general/GeneralCodeGeneration";

export const generateCode = async (
  extraInstructions: string,
  selection: vscode.Range,
  editor: vscode.TextEditor
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
    case "pyhton":
      codeGeneration = new PythonCodeGeneration(
        extraInstructions,
        selection,
        editor
      );
      break;
    default:
      codeGeneration = new GeneralCodeGeneration(
        extraInstructions,
        selection,
        editor
      );
  }

  return await codeGeneration.generateCode();
};
