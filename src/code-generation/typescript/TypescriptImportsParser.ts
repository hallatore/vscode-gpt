import ImportsParserBase, { Import } from "../core/ImportsParserBase";

class TypescriptImportsParser extends ImportsParserBase {
  findImportSections(codeBlock: string): Import[] {
    const regex =
      /import ([\w *]*)[,]*([\{ ]*)([\w *,\r\n]*)([\} ]*) from ([\"']+)([\w \.\\/\-_]+)[\"']+[;]*/gm;
    const matches = codeBlock.matchAll(regex);
    const result: Import[] = [];

    for (const match of matches) {
      const defaultImport = match[1];
      const imports = match[3];
      const module = match[6];

      result.push({
        defaultImport,
        imports: imports
          ?.split(",")
          .map((i) => i.trim())
          .filter((i) => !!i),
        module,
        quoteType: match[5].startsWith("'") ? "'" : '"',
        originalValue: match[0],
        updated: false,
      });
    }

    return result;
  }

  formatImport(item: Import): string {
    if (!item.updated) {
      return item.originalValue;
    }

    let defaultImport = "";
    let imports = "";

    if (item.imports && item.imports.length > 0) {
      imports = `{ ${item.imports.join(", ")} } `;
    }

    if (item.defaultImport) {
      defaultImport = `${item.defaultImport}${!!imports ? "," : ""} `;
    }

    return `import ${defaultImport}${imports}from ${item.quoteType}${item.module}${item.quoteType};`;
  }
}

export default TypescriptImportsParser;
