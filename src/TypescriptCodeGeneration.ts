import * as vscode from "vscode";
import { TextDocument } from "vscode";
import { CodeGeneration, CodeResult } from "./CodeGeneration";

// Add a docstring describing what the function does.

const systemPromptBase = `
You are a helpful typescript code generator. 
Always respond with the modified query and a single code block. 

Modify the query to be more specific. The user might write vague queries like "make pancakes". In this example the modified query would be "Give me a recipe for pancakes". Infer the specificity of the query without asking the user.

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
...
\`\`\`
`;

export class TypescriptCodeGeneration extends CodeGeneration {
  getSystemPrompt(document: TextDocument): string {
    let systemPrompt = systemPromptBase.trim();

    //   const existingImports = getImportSection(document.getText());
    //   if (existingImports) {
    //     systemPrompt += "\n\nAlready declared imports:\n" + existingImports;
    //   }

    const documentMetadata = getMetatada(document.getText(), this.selection);
    if (documentMetadata) {
      systemPrompt +=
        "\n\nCurrent document metadata structure:\n" + documentMetadata;
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

    if (line.startsWith("import ") || line.trim() === "") {
      imports.push(line);
    } else {
      break;
    }
  }

  return imports.join("\n");
};

const getMetatada = (codeBlock: string, selection: vscode.Range): string => {
  const lines = codeBlock.split("\n");
  const metadata: { line: number; text: string }[] = [];
  //metadata.push({ line: currentLine, text: '# User input' });

  const functions = codeBlock.matchAll(
    /(^|\n)(export |)const [\w]+(: [\w<>.]+|) =[ \n]*[\w\(\)\{\} :,]+=>/g
  );

  for (const f of functions) {
    metadata.push({ line: getLinesBefore(f.index!, codeBlock), text: f[0] });
  }

  const styledComponents = codeBlock.matchAll(
    /(^|\n)(export |)const [\w]+(: [\w<>.]+|) = styled[\w\(\)\{\} :.<>`]+/g
  );

  for (const f of styledComponents) {
    metadata.push({ line: getLinesBefore(f.index!, codeBlock), text: f[0] });
  }

  lines.forEach((text, line) => {
    if (/^import /.test(text)) {
      metadata.push({ line, text });
    }
  });

  return metadata
    .filter((m) => m.line < selection.end.line && m.line < selection.start.line)
    .sort((a, b) => a.line - b.line)
    .map((m) => `Line ${m.line}: ${m.text}`)
    .join("\n");
};

const getLinesBefore = (index: number, text: string): number => {
  return text.substring(0, index + 1).split("\n").length;
};
