import ImportsParserBase, { Import } from "../core/ImportsParserBase";

class PythonImportsParser extends ImportsParserBase {
  findImportSections(codeBlock: string): Import[] {
    return this.findPythonImportSections(codeBlock).concat(
      this.findPythonFromImportSections(codeBlock)
    );
  }

  findPythonFromImportSections(codeBlock: string): Import[] {
    const regex = /(^|\n)from ([\w *]*) import ([\w *,]*)[\r\n]+/gm;
    const matches = codeBlock.matchAll(regex);
    const result: Import[] = [];

    for (const match of matches) {
      result.push({
        module: match[2],
        imports: match[3]
          ?.split(",")
          .map((i) => i.trim())
          .filter((i) => !!i),
        originalValue: match[0].replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, ""),
        updated: false,
        kind: "python_from_import",
      });
    }

    return result;
  }

  findPythonImportSections(codeBlock: string): Import[] {
    const regex = /(^|\n)import ([\w *]*)/gm;
    const matches = codeBlock.matchAll(regex);
    const result: Import[] = [];

    for (const match of matches) {
      result.push({
        module: match[2],
        originalValue: match[0].replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, ""),
        updated: false,
        kind: "python_import",
      });
    }

    return result;
  }

  formatImport(item: Import): string {
    if (!item.updated) {
      return item.originalValue;
    }

    if (item.kind === "python_import") {
      return `import ${item.module}`;
    }

    if (item.kind === "python_from_import") {
      return `from ${item.module} import ${item.imports?.join(", ")}`;
    }

    return item.originalValue;
  }
}

export default PythonImportsParser;
