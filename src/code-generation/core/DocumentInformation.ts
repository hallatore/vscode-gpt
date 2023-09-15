import * as vscode from "vscode";

export type LineMetadata = { line: number; text: string };

class DocumentInformation {
  generateDocumentOutline(
    codeBlock: string,
    currentSelection: vscode.Range
  ): string {
    return this.combineLines(
      this.generateMetadata(codeBlock, currentSelection)
    );
  }

  protected generateMetadata(
    codeBlock: string,
    currentSelection: vscode.Range
  ): LineMetadata[] {
    if (codeBlock.length < 1000) {
      return this.getAllLines(codeBlock);
    }

    let metadata: LineMetadata[] = [];
    metadata = metadata.concat(this.getTopLevelLines(codeBlock));
    metadata = metadata.concat(
      this.getLinesAroundSelection(
        currentSelection.start.line,
        currentSelection.end.line,
        codeBlock,
        10
      )
    );

    return metadata;
  }

  protected combineLines(lines: LineMetadata[]): string {
    return this.reduceAndSortLines(lines)
      .map((m) => `Line ${m.line}: ${m.text}`)
      .join("\n");
  }

  protected getAllLines(codeBlock: string): LineMetadata[] {
    return codeBlock
      .split("\n")
      .map((text, line) => ({ line: line + 1, text }));
  }

  protected reduceAndSortLines(lines: LineMetadata[]): LineMetadata[] {
    return lines
      .reduce((acc, curr) => {
        if (!acc.find((a) => a.line === curr.line)) {
          acc.push(curr);
        }
        return acc;
      }, [] as LineMetadata[])
      .sort((a, b) => a.line - b.line);
  }

  protected getLinesAroundSelection(
    lineStart: number,
    lineEnd: number,
    codeBlock: string,
    padding: number
  ): LineMetadata[] {
    const lines = codeBlock.split("\n");
    const result = [];

    for (let i = lineStart - padding; i <= lineEnd + padding; i++) {
      if (i >= 0 && i < lines.length) {
        result.push({ line: i + 1, text: this.trimEnds(lines[i]) });
      }
    }

    return result;
  }

  protected getTopLevelLines(codeBlock: string): LineMetadata[] {
    return this.getLinesMatching(/(^|\n)[\w]+/g, codeBlock);
  }

  protected getLinesMatching(regex: RegExp, codeBlock: string): LineMetadata[] {
    const matches = codeBlock.matchAll(regex);
    const result: LineMetadata[] = [];

    for (const match of matches) {
      const line = this.getLineNumberFromIndex(match.index!, codeBlock);
      const text = this.trimEnds(
        this.getWholeLine(
          match.index!,
          match.index! + match[0].length,
          codeBlock
        )
      );

      text
        .split("\n")
        .forEach((t, i) => result.push({ line: line + i, text: t }));
    }

    return result;
  }

  protected getLineNumberFromIndex(index: number, text: string): number {
    return text.substring(0, index + 1).split("\n").length;
  }

  protected getWholeLine(
    startIndex: number,
    endIndex: number,
    text: string
  ): string {
    const nextEndLineIndex = text.indexOf("\n", endIndex);
    return text.substring(startIndex, nextEndLineIndex);
  }

  protected trimEnds(codeBlock: string): string {
    return codeBlock.replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, "");
  }
}

export default DocumentInformation;
