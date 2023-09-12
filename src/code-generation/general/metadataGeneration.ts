import * as vscode from "vscode";
import {
  LineMetadata,
  combineLines,
  getAllLines,
  getLinesAroundSelection,
  getTopLevelLines,
} from "../metadataGeneration";

export const generateDocumentMetadata = (
  codeBlock: string,
  currentSelection: vscode.Range
): string => {
  let metadata: LineMetadata[] = [];

  if (codeBlock.length < 1000) {
    return combineLines(getAllLines(codeBlock));
  }

  metadata = metadata.concat(getTopLevelLines(codeBlock));
  metadata = metadata.concat(
    getLinesAroundSelection(
      currentSelection.start.line,
      currentSelection.end.line,
      codeBlock,
      10
    )
  );

  return combineLines(metadata);
};
