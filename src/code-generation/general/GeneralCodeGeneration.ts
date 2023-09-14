import * as vscode from "vscode";
import * as path from "path";
import { TextDocument } from "vscode";
import { generateDocumentMetadata } from "./metadataGeneration";
import CodeGenerationBase from "../CodeGenerationBase";

// Add a docstring describing what the function does.

const systemPromptBase = (languageId: string) => `
You are a helpful ${languageId} code generator. 
Always respond with the modified query and a single code block. 

Modify the query to be more specific. The user might write vague queries like "make pancakes". In this example the modified query would be "Give me a recipe for pancakes". Infer the specificity of the query without asking the user. Use filename and document metadata as help when modifying the query.

All functions should have strong typing on input and output. 
Do not add extra text/information/warnings to the response.
Split the logic into separate functions if it makes it easier to read.
Reuse functions and imports found in the current document metadata structure.
Do not generate code that is already in the current document.

Example response to the query "Sum two numbers":
Modified query: "Make a function that returns the sum of two numbers"
Code block:
\`\`\`

\`\`\`
`;

class GeneralCodeGeneration extends CodeGenerationBase {
  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    super(extraInstructions, selection, editor);
  }

  getSystemPrompt(document: TextDocument): string {
    let systemPrompt = systemPromptBase(document.languageId).trim();

    const documentMetadata = generateDocumentMetadata(
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
}

export default GeneralCodeGeneration;
