import * as vscode from "vscode";
import DocumentInformation, { LineMetadata } from "../core/DocumentInformation";

class TypescriptDocumentInformation extends DocumentInformation {
  protected generateMetadata(
    codeBlock: string,
    currentSelection: vscode.Range
  ): LineMetadata[] {
    let metadata = super.generateMetadata(codeBlock, currentSelection);
    metadata = metadata.concat(this.getFunctions(codeBlock));
    metadata = metadata.concat(this.getInterfacesAndTypes(codeBlock));
    return metadata;
  }

  getFunctions(codeBlock: string): LineMetadata[] {
    return this.getLinesMatching(
      /(^|\n)(export |)const [\w]+(: [\w\.]+|) =[^=]*=>/g,
      codeBlock
    );
  }

  getInterfacesAndTypes(codeBlock: string): LineMetadata[] {
    return this.getLinesMatching(
      /(^|\n)(export |)(interface|type) [\w]+ {[^}]*}/g,
      codeBlock
    );
  }
}

export default TypescriptDocumentInformation;
