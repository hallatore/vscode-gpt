import * as vscode from "vscode";
import * as path from "path";
import OpenAI from "openai";
import { chatCompletionStream } from "../../gpt-api";
import ImportsParserBase from "./ImportsParserBase";
import { CodeResult } from "./CodeResult";
import { KeyValuePair } from "./CodeResult";
import DocumentInformation from "./DocumentInformation";
import { generateSystemPrompt } from "./generateSystemPrompt";

class CodeGenerationBase {
  extraInstructions: string;
  selection!: vscode.Range;
  editor!: vscode.TextEditor;
  documentInformation: DocumentInformation;
  importsParser?: ImportsParserBase;

  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    this.extraInstructions = extraInstructions;
    this.selection = selection;
    this.editor = editor;
    this.documentInformation = new DocumentInformation();
  }

  getSystemPrompt(document: vscode.TextDocument): string {
    const extraPreferences = this.getExtraPreferences(document.languageId);
    let systemPrompt = generateSystemPrompt(
      document.languageId,
      extraPreferences
    );

    const documentMetadata = this.documentInformation.generateDocumentOutline(
      document.getText(),
      this.selection
    );

    if (documentMetadata) {
      systemPrompt += `\n\nFilename: ${path.basename(
        document.fileName
      )}\nCurrent document metadata structure:\n${documentMetadata}`;
    }

    return systemPrompt;
  }

  getExtraPreferences(languageId: string): string {
    const config = vscode.workspace.getConfiguration("vscode-gpt");
    const extraPreferences =
      config.get<{ languageId?: string; value: string }[]>("extraPreferences");

    const result: string[] = [];

    if (extraPreferences) {
      for (const preference of extraPreferences) {
        if (
          !preference.languageId ||
          preference.languageId
            .split(",")
            .map((item) => item.trim())
            .includes(languageId)
        ) {
          result.push(preference.value);
        }
      }
    }

    return result.join("\n");
  }

  async generateCode(
    streamCallback: (result: CodeResult | null) => void,
    cancellationToken: vscode.CancellationToken
  ): Promise<CodeResult | null> {
    const initialDocumentText = this.editor.document.getText();
    const systemPrompt = this.getSystemPrompt(this.editor.document);
    const userPrompt = this.getUserPrompt();
    let gptResponse = "";

    await this.chatCompletion(
      systemPrompt,
      userPrompt,
      (partialContent) => {
        gptResponse += partialContent;
        const codeBlock = parseCodeBlock(gptResponse);
        const modifiedQuery = parseModifiedQuery(gptResponse);

        if (codeBlock) {
          const partialResult = this.parseResult(
            codeBlock,
            initialDocumentText
          );

          // Workaround to avoid vscode triggering stuff like auto closing brackets, etc while code is being generated.
          if (
            !partialResult.codeBlock.endsWith(">") &&
            !partialResult.codeBlock.endsWith('"') &&
            !partialResult.codeBlock.endsWith("'")
          ) {
            streamCallback({
              codeBlock: partialResult.codeBlock,
              modifiedQuery,
            });
          }
        }
      },
      cancellationToken
    );

    if (!gptResponse) {
      writeToVsCodeOutput("Error", "Failed to get response from GPT");
      return null;
    }

    writeToVsCodeOutput("Response", gptResponse);
    const codeBlock = parseCodeBlock(gptResponse);

    if (codeBlock) {
      return this.parseResult(codeBlock, initialDocumentText);
    }

    writeToVsCodeOutput("Error", "No code block found in response");
    return {
      codeBlock: gptResponse,
    };
  }

  async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    streamCallback: (message: string) => void,
    cancellationToken: vscode.CancellationToken
  ) {
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

    await chatCompletionStream(messages, streamCallback, cancellationToken);
  }

  parseResult(result: string, oldCode: string): CodeResult {
    let textToReplace: KeyValuePair[] = [];

    if (this.importsParser && this.selection.start.line > 0) {
      textToReplace = this.importsParser.combineNewAndOldImports(
        result,
        oldCode
      );
      const importSections = this.importsParser.findImportSections(result);

      if (importSections) {
        importSections.forEach((importSection) => {
          result = result.replace(importSection.originalValue, "").trim();
        });
      }
    }

    // Remove "..." placeholder text from GPT response
    result = result.replaceAll(/(\n|)[ /#]*\.\.\.[\W]*\n/gm, "");

    return {
      codeBlock: result,
      textToReplace,
    };
  }

  getUserPrompt() {
    const selectedCodeBlock = this.editor.document.getText(this.selection);
    const selectedLines =
      this.selection.start.line === this.selection.end.line
        ? `Your response will replace line ${this.selection.start.line + 1}`
        : `Your response will replace line ${this.selection.start.line + 1} - ${
            this.selection.end.line + 1
          }`;
    let userPrompt = selectedLines + "\n```\n" + selectedCodeBlock + "\n```";

    if (this.extraInstructions) {
      userPrompt = `${this.extraInstructions}\n\n${userPrompt}`;
    }

    return userPrompt;
  }
}

const parseModifiedQuery = (chatResponse: string): string | undefined => {
  const match = /Modified query: \"([\w ]+)(\"|)/gm.exec(chatResponse);

  if (match && match[1]) {
    return match[1];
  }
};

const parseCodeBlock = (chatResponse: string): string | undefined => {
  const match = /```[\w]*[\r\n]*([\s\S]*)([\r\n]*```|)/gm.exec(chatResponse);

  if (match && match[1]) {
    return match[1].replace(/([\r\n]*```)/gm, "");
  }
};

const paddAllLinesWith = (text: string, padding: string) => {
  return text
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
};

const vsCodeOutput = vscode.window.createOutputChannel("vscode-gpt");

const writeToVsCodeOutput = (title: string, text: string) => {
  vsCodeOutput.appendLine(`${title}\n\n${paddAllLinesWith(text, "    ")}\n\n`);
};

export default CodeGenerationBase;
