export type LineMetadata = { line: number; text: string };

export const combineLines = (lines: LineMetadata[]): string => {
  return reduceAndSortLines(lines)
    .map((m) => `Line ${m.line}: ${m.text}`)
    .join("\n");
};

export const getAllLines = (codeBlock: string): LineMetadata[] => {
  return codeBlock.split("\n").map((text, line) => ({ line: line + 1, text }));
};

export const reduceAndSortLines = (lines: LineMetadata[]): LineMetadata[] => {
  return lines
    .reduce((acc, curr) => {
      if (!acc.find((a) => a.line === curr.line)) {
        acc.push(curr);
      }
      return acc;
    }, [] as LineMetadata[])
    .sort((a, b) => a.line - b.line);
};

export const getTopLevelLines = (codeBlock: string): LineMetadata[] => {
  return getLinesMatching(/(^|\n)[\w]+/g, codeBlock);
};

export const getLinesMatching = (
  regex: RegExp,
  codeBlock: string
): LineMetadata[] => {
  const matches = codeBlock.matchAll(regex);

  return [...matches].map((f) => ({
    line: getLineNumberFromIndex(f.index!, codeBlock),
    text: trimEnds(getWholeLine(f.index!, f.index! + f[0].length, codeBlock)),
  }));
};

const getLineNumberFromIndex = (index: number, text: string): number => {
  return text.substring(0, index + 1).split("\n").length;
};

const getWholeLine = (
  startIndex: number,
  endIndex: number,
  text: string
): string => {
  const nextEndLineIndex = text.indexOf("\n", endIndex);
  return text.substring(startIndex, nextEndLineIndex);
};

export const getLinesAroundSelection = (
  lineStart: number,
  lineEnd: number,
  codeBlock: string,
  padding: number
): LineMetadata[] => {
  const lines = codeBlock.split("\n");
  const result = [];

  for (let i = lineStart - padding; i <= lineEnd + padding; i++) {
    if (i >= 0 && i < lines.length) {
      result.push({ line: i + 1, text: trimEnds(lines[i]) });
    }
  }

  return result;
};

const trimEnds = (codeBlock: string): string => {
  return codeBlock.replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, "");
};
