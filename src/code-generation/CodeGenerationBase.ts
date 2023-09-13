import * as vscode from "vscode";
import { vsCodeOutput } from "../extension";
import OpenAI from "openai";
import { chatCompletion } from "../gpt-api";

export interface CodeResult {
  codeBlock: string;
  importSection?: string;
}

export abstract class CodeGenerationBase {
  extraInstructions: string;
  selection!: vscode.Range;
  editor!: vscode.TextEditor;

  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    this.extraInstructions = extraInstructions;
    this.selection = selection;
    this.editor = editor;
  }

  async generateCode(): Promise<CodeResult | null> {
    const systemPrompt = this.getSystemPrompt(this.editor.document);
    const selectedCodeBlock = this.editor.document.getText(this.selection);
    const selectedLines =
      this.selection.start.line === this.selection.end.line
        ? `Line ${this.selection.start.line + 1}`
        : `Line ${this.selection.start.line + 1} - ${
            this.selection.end.line + 1
          }`;
    let userPrompt = selectedLines + "\n```\n" + selectedCodeBlock + "\n```";

    if (this.extraInstructions) {
      userPrompt = `${this.extraInstructions}\n\n${userPrompt}`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    writeToVsCodeOutput("System prompt", systemPrompt);
    writeToVsCodeOutput("User prompt", userPrompt);

    //return null;

    const result = await chatCompletion(messages);

    if (!result) {
      return null;
    }

    writeToVsCodeOutput("Response", result);
    const match = /```[\w]*[\r\n]*([\s\S]*?)[\r\n]*```/gm.exec(result);

    if (match && match[1]) {
      let codeBlock = match[1];
      return this.parseResult(codeBlock);
    }

    writeToVsCodeOutput("Error", "No code block found in response");
    return {
      codeBlock: result,
    };
  }

  abstract getSystemPrompt(document: vscode.TextDocument): string;
  abstract parseResult(result: string): CodeResult;
}

const paddAllLinesWith = (text: string, padding: string) => {
  return text
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
};

const writeToVsCodeOutput = (title: string, text: string) => {
  vsCodeOutput.appendLine(`${title}\n\n${paddAllLinesWith(text, "    ")}\n\n`);
};
