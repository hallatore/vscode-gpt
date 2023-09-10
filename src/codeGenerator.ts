import * as vscode from "vscode";
import { chatCompletion } from "./gpt-api";
import { vsCodeOutput } from "./extension";
import OpenAI from "openai";
import { CodeResult } from "./CodeGeneration";
import { PythonCodeGeneration } from "./PythonCodeGeneration";
import { TypescriptCodeGeneration } from "./TypescriptCodeGeneration";

export const generateCode = async (
  query: string,
  selection: vscode.Range,
  editor: vscode.TextEditor
): Promise<CodeResult | null> => {
  switch (editor.document.languageId) {
    case "typescript":
    case "typescriptreact":
      return await new TypescriptCodeGeneration(
        selection,
        editor
      ).generateCode();
    case "pyhton":
    default:
      return await new PythonCodeGeneration(selection, editor).generateCode();
  }
};

const pythonSystemPrompt = `
You are a helpful python code generator. 
Always respond with the modified query and a single code block. 

Modify the query to be more specific. The user might write vague queries like "make pancakes". In this example the modified query would be "Give me a recipe for pancakes". Infer the specificity of the query without asking the user.

All functions should have strong typing on input and output. 
Add a docstring describing what the function does.
Do not add extra text/information/warnings to the response.
Split the logic into separate functions if it makes it easier to read.
Reuse functions and imports found in the code block metadata.

Example response to the query "Sum two numbers":
Modified query: "Make a function that returns the sum of two numbers"
Code block:
\`\`\`python
...
\`\`\`
`.trim();

const paddAllLinesWith = (text: string, padding: string) => {
  return text
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
};

const writeToOutput = (title: string, text: string) => {
  vsCodeOutput.appendLine(`${title}\n\n${paddAllLinesWith(text, "    ")}\n\n`);
};

const generatePythonCode = async (
  query: string,
  selection: vscode.Range,
  editor: vscode.TextEditor
): Promise<CodeResult | null> => {
  const systemPrompt = getSystemPrompt(editor.document);
  const selectedCode = editor.document.getText(selection).trim();
  let userQuery = selectedCode;
  //   let userQuery = `"${query}"`;

  //   if (selectedCode) {
  //     userQuery = `${userQuery}\n\n\`\`\`\n${selectedCode}}\n\`\`\``;
  //   }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userQuery,
    },
  ];

  writeToOutput("Request", JSON.stringify(messages, null, 2));

  const result = await chatCompletion(messages);

  if (!result) {
    return null;
  }

  writeToOutput("Response", result);
  const match = /```[\w]*([\s\S]*?)```/gm.exec(result);

  if (match && match[1]) {
    //return match[1].trim();
    let codeBlock = match[1].trim();
    const importSection = getImportSection(codeBlock);

    if (importSection) {
      codeBlock = codeBlock.replace(importSection, "").trim();
    }

    return {
      codeBlock,
      importSection,
    };
  }

  return {
    codeBlock: result,
  };
};

const getSystemPrompt = (document: vscode.TextDocument): string => {
  let systemPrompt = pythonSystemPrompt;

  //   const existingImports = getImportSection(document.getText());
  //   if (existingImports) {
  //     systemPrompt += "\n\nAlready declared imports:\n" + existingImports;
  //   }

  const documentMetadata = getMetatada(document.getText(), 0);
  if (documentMetadata) {
    systemPrompt +=
      "\n\nCurrent document metadata structure:\n" + documentMetadata;
  }

  return systemPrompt;
};

const getExistingImports = (document: vscode.TextDocument): string[] => {
  const imports: string[] = [];
  let linesWithoutImports = 0;

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;

    if (line.startsWith("import ") || line.startsWith("from ")) {
      imports.push(line);
    } else {
      linesWithoutImports++;
    }

    if (linesWithoutImports > 5) {
      break;
    }
  }

  return imports;
};

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

const getMetatada = (codeBlock: string, currentLine: number): string => {
  const lines = codeBlock.split("\n");
  const metadata: { line: number; text: string }[] = [];
  //metadata.push({ line: currentLine, text: '# User input' });

  lines.forEach((text, index) => {
    if (
      /^import /.test(text) ||
      /^from /.test(text) ||
      /class [\w]+:/.test(text) ||
      /def [\w]+\(/.test(text)
    ) {
      metadata.push({ line: currentLine + index, text: text });
    }
  });

  return metadata.map((m) => `Line ${m.line}: ${m.text}`).join("\n");
};
