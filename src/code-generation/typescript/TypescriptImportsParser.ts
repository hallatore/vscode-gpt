import ImportsParserBase, { Import } from "../ImportsParserBase";

class TypescriptImportsParser extends ImportsParserBase {
  findImportSections(codeBlock: string): Import[] {
    const regex =
      /import ([\w *]*)[,]*([\{ ]*)([\w *,\n]*)([\} ]*) from [\"']+([\w \.\\/\-_]+)[\"']+[;]*/gm;
    const matches = codeBlock.matchAll(regex);
    const result: Import[] = [];

    for (const match of matches) {
      const defaultImport = match[1];
      const imports = match[3];
      const module = match[5];

      result.push({
        defaultImport,
        imports: imports
          ?.split(",")
          .map((i) => i.trim())
          .filter((i) => !!i),
        module,
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

    return `import ${defaultImport}${imports}from "${item.module}";`;
  }
}

export default TypescriptImportsParser;
