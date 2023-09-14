import * as vscode from "vscode";
import * as path from "path";
import { TextDocument } from "vscode";
import CodeGenerationBase from "../CodeGenerationBase";
import { generateDocumentMetadata } from "./metadataGeneration";
import { getExtraInformation } from "./extraInformation";
import TypescriptImportsParser from "./TypescriptImportsParser";

// Add a docstring describing what the function does.

const systemPromptBase = `
You are a helpful typescript code generator. 
Always respond with the modified query and a single code block. 

Modify the query to be more specific. The user might write vague queries like "make pancakes". In this example the modified query would be "Give me a recipe for pancakes". Infer the specificity of the query without asking the user. Use filename and document metadata as help when modifying the query.

All functions should have strong typing on input and output. 
Do not add extra text/information/warnings to the response.
Split the logic into separate functions if it makes it easier to read.
Reuse functions and imports found in the current document metadata structure.
Do not generate code that is already in the current document.
Use const instead of function when possible.

Example response to the query "Sum two numbers":
Modified query: "Make a function that returns the sum of two numbers"
Code block:
\`\`\`typescript

\`\`\`
`;

class TypescriptCodeGeneration extends CodeGenerationBase {
  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    super(extraInstructions, selection, editor);
    this.importsParser = new TypescriptImportsParser();
  }

  getSystemPrompt(document: TextDocument): string {
    let systemPrompt = systemPromptBase.trim();

    const documentMetadata = generateDocumentMetadata(
      document.getText(),
      this.selection
    );

    if (documentMetadata) {
      systemPrompt += `\n\nFilename: ${path.basename(
        document.fileName
      )}\nCurrent document metadata structure:\n${documentMetadata}`;
    }

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
