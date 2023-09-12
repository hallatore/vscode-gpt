import * as vscode from "vscode";
import {
  LineMetadata,
  combineLines,
  getAllLines,
  getLinesAroundSelection,
  getLinesMatching,
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
  metadata = metadata.concat(getFunctions(codeBlock));
  metadata = metadata.concat(getStyledComponents(codeBlock));
  metadata = metadata.concat(getImports(codeBlock));
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

export const getFunctions = (codeBlock: string): LineMetadata[] => {
  return getLinesMatching(
    /(^|\n)(export |)const [\w]+(: [\w<>.]+|) =[ \n]*[\w\(\)\{\} :,]+=>/g,
    codeBlock
  );
};

export const getStyledComponents = (codeBlock: string): LineMetadata[] => {
  return getLinesMatching(
    /(^|\n)(export |)const [\w]+(: [\w<>.]+|) = styled[\w\(\)\{\} :.<>`]+/g,
    codeBlock
  );
};

export const getImports = (codeBlock: string): LineMetadata[] => {
  return getLinesMatching(/(^|\n)import /g, codeBlock);
};
