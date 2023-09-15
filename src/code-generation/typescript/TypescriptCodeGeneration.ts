import * as vscode from "vscode";
import { TextDocument } from "vscode";
import CodeGenerationBase from "../core/CodeGenerationBase";
import { getExtraInformation } from "./extraInformation";
import TypescriptImportsParser from "./TypescriptImportsParser";
import TypescriptDocumentInformation from "./TypescriptDocumentInformation";

class TypescriptCodeGeneration extends CodeGenerationBase {
  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    super(extraInstructions, selection, editor);
    this.importsParser = new TypescriptImportsParser();
    this.documentInformation = new TypescriptDocumentInformation();
  }

  getSystemPrompt(document: TextDocument): string {
    let systemPrompt = super.getSystemPrompt(document);
    const extraInformation = getExtraInformation(document);

    if (extraInformation && extraInformation.length > 0) {
      systemPrompt += `\n\nExtra information:\n${extraInformation
        .map((item) => item.value)
        .join("\n")}`;
    }

    return systemPrompt;
  }
}

export default TypescriptCodeGeneration;
