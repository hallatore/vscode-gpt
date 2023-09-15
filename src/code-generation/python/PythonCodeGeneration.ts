import * as vscode from "vscode";
import CodeGenerationBase from "../core/CodeGenerationBase";
import PythonImportsParser from "./PythonImportsParser";

class PythonCodeGeneration extends CodeGenerationBase {
  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    super(extraInstructions, selection, editor);
    this.importsParser = new PythonImportsParser();
  }
}

export default PythonCodeGeneration;
