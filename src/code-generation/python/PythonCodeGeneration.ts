import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { CodeGenerationBase, CodeResult } from "../CodeGenerationBase";
import path = require("path");
import { generateDocumentMetadata } from "./metadataGeneration";

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
...
\`\`\`
`;

export class PythonCodeGeneration extends CodeGenerationBase {
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

  parseResult(result: string): CodeResult {
    let codeBlock = result;
    const importSection = getImportSection(codeBlock);

    if (importSection) {
      codeBlock = codeBlock.replace(importSection, "").trim();
    }

    return {
      codeBlock,
      importSection,
    };
  }
}

const getImportSection = (codeBlock: string): string => {
  const imports: string[] = [];

  const lines = codeBlock.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      line.startsWith("import ") ||
      line.startsWith("from ") ||
      line.trim() === ""
    ) {
      imports.push(line);
    } else {
      break;
    }
  }

  return imports.join("\n");
};
