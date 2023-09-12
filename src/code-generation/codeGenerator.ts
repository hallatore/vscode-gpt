import * as vscode from "vscode";
import { CodeResult } from "./CodeGenerationBase";
import { PythonCodeGeneration } from "./python/PythonCodeGeneration";
import { TypescriptCodeGeneration } from "./typescript/TypescriptCodeGeneration";
import { GeneralCodeGeneration } from "./general/GeneralCodeGeneration";

export const generateCode = async (
  extraInstructions: string,
  selection: vscode.Range,
  editor: vscode.TextEditor
): Promise<CodeResult | null> => {
  switch (editor.document.languageId) {
    case "typescript":
    case "typescriptreact":
      return await new TypescriptCodeGeneration(
        extraInstructions,
        selection,
        editor
      ).generateCode();
    case "pyhton":
      return await new PythonCodeGeneration(
        extraInstructions,
        selection,
        editor
      ).generateCode();
    default:
      return await new GeneralCodeGeneration(
        extraInstructions,
        selection,
        editor
      ).generateCode();
  }
};
