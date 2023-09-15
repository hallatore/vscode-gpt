import * as vscode from "vscode";
import * as path from "path";
import { TextDocument } from "vscode";
import CodeGenerationBase from "../CodeGenerationBase";
import { generateDocumentMetadata } from "./metadataGeneration";
import PythonImportsParser from "./PythonImportsParser";

// Add a docstring describing what the function does.

const systemPromptBase = `
You are a helpful python code generator. 
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
\`\`\`python

\`\`\`
`;

class PythonCodeGeneration extends CodeGenerationBase {
  constructor(
    extraInstructions: string,
    selection: vscode.Range,
    editor: vscode.TextEditor
  ) {
    super(extraInstructions, selection, editor);
    this.importsParser = new PythonImportsParser();
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

    return systemPrompt;
  }
}

export default PythonCodeGeneration;
