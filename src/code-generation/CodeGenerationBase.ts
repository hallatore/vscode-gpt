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
    const selectedCodeBlock = this.editor.document
      .getText(this.selection)
      .trim();

    let userPrompt = selectedCodeBlock;

    if (this.extraInstructions) {
      userPrompt = `${this.extraInstructions}\n\n${selectedCodeBlock}`;
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

    const result = await chatCompletion(messages);

    if (!result) {
      return null;
    }

    writeToVsCodeOutput("Response", result);
    const match = /```[\w]*([\s\S]*?)```/gm.exec(result);

    if (match && match[1]) {
      let codeBlock = match[1].trim();
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
