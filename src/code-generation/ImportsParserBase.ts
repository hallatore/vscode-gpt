import { KeyValuePair } from "./CodeResult";

export type Import = {
  defaultImport?: string;
  imports?: string[];
  module: string;
  originalValue: string;
  updated: boolean;
  kind?: string;
};

abstract class ImportsParserBase {
  abstract findImportSections(codeBlock: string): Import[];
  abstract formatImport(item: Import): string;

  combineImport(oldItem: Import, newItem: Import): Import {
    newItem.updated = true;
    newItem.originalValue = oldItem.originalValue;

    if (
      oldItem.defaultImport &&
      newItem.defaultImport !== oldItem.defaultImport
    ) {
      newItem.defaultImport = oldItem.defaultImport;
    }

    if (oldItem.imports) {
      if (!newItem.imports) {
        newItem.imports = [];
      }

      if (oldItem.imports) {
        oldItem.imports.forEach((item) => {
          if (!newItem.imports?.includes(item)) {
            newItem.imports?.push(item);
          }
        });
      }
    }

    return newItem;
  }

  combineNewAndOldImports(
    newImportSection: string,
    oldImportSection?: string
  ): KeyValuePair[] {
    const textToReplace: KeyValuePair[] = [];

    if (!oldImportSection) {
      textToReplace.push({
        key: "",
        value: newImportSection,
      });
    } else {
      const newCodeImports = this.findImportSections(newImportSection);
      const oldCodeImports = this.findImportSections(oldImportSection);
      const modifiedImports: Import[] = [];

      newCodeImports.forEach((codeBlockImport) => {
        const oldCodeImport = oldCodeImports.find(
          (item) => item.module === codeBlockImport.module
        );

        if (
          oldCodeImport &&
          this.formatImport(codeBlockImport) !==
            this.formatImport(oldCodeImport)
        ) {
          modifiedImports.push(
            this.combineImport(oldCodeImport, codeBlockImport)
          );
        } else if (!oldCodeImport) {
          modifiedImports.push(codeBlockImport);
        }
      });

      modifiedImports.forEach((item) => {
        textToReplace.push({
          key: item.updated ? item.originalValue : "",
          value: this.formatImport(item),
        });
      });
    }

    return textToReplace;
  }
}

export default ImportsParserBase;
